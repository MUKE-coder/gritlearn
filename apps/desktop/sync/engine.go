// Package sync is the offline-first engine for the desktop app.
//
// Data model:
//   - records — local mirror of every row the user has touched. Reads
//     come from this table; pulls UPSERT into it.
//   - outbox  — pending local changes that haven't been pushed yet.
//     One entry per (table_name, entity_id) — multiple edits squash.
//
// Wire flow:
//   - LocalCreate/Update/Delete writes both records (so reads see the
//     change immediately) AND an outbox entry.
//   - Sync() runs Pull then Push:
//       Pull updates records from /api/sync/pull?model=X&since=...
//       Push posts the outbox to /api/sync/push and applies results.
//   - Conflicts surface as outbox rows with HasConflict=true so the UI
//     can present a per-field merge dialog. ResolveConflict(...) writes
//     the merged data back into the outbox and clears the flag.
package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	gosync "sync"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Engine owns the local SQLite database and the HTTP transport used to
// talk to /api/sync. One Engine per running app.
type Engine struct {
	DB        *gorm.DB
	APIURL    string
	GetToken  func() (string, error)
	HTTP      *http.Client
	cursors   map[string]string // last pull cursor per model
	cursorsMu gosync.RWMutex
}

// Open initializes a sync engine. dbPath is the absolute path to the
// SQLite file; apiURL is the base API URL ending in "/api". getToken
// returns the user's current bearer token (called per request).
func Open(dbPath, apiURL string, getToken func() (string, error)) (*Engine, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("creating data dir: %w", err)
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("opening local db: %w", err)
	}
	if err := db.AutoMigrate(&Record{}, &Outbox{}, &Cursor{}); err != nil {
		return nil, fmt.Errorf("migrating local db: %w", err)
	}
	return &Engine{
		DB:       db,
		APIURL:   apiURL,
		GetToken: getToken,
		HTTP:     &http.Client{Timeout: 30 * time.Second},
		cursors:  make(map[string]string),
	}, nil
}

// SyncResult summarizes one Sync run for the UI.
type SyncResult struct {
	Pushed     int            `json:"pushed"`
	Pulled     int            `json:"pulled"`
	Conflicts  int            `json:"conflicts"`
	Errors     []string       `json:"errors,omitempty"`
	StartedAt  time.Time      `json:"started_at"`
	FinishedAt time.Time      `json:"finished_at"`
}

// Sync runs Pull → Push. Pull first so the user pushes against the
// freshest server state and conflict surface area is minimized. Models
// is the list of table names to pull; pass empty to skip pull.
func (e *Engine) Sync(models []string) (*SyncResult, error) {
	res := &SyncResult{StartedAt: time.Now()}

	for _, m := range models {
		n, err := e.Pull(m)
		if err != nil {
			res.Errors = append(res.Errors, fmt.Sprintf("pull %s: %v", m, err))
			continue
		}
		res.Pulled += n
	}

	pushed, conflicts, err := e.Push()
	if err != nil {
		res.Errors = append(res.Errors, fmt.Sprintf("push: %v", err))
	}
	res.Pushed = pushed
	res.Conflicts = conflicts
	res.FinishedAt = time.Now()
	return res, nil
}

// Pull fetches every row in modelName updated after our last cursor
// and UPSERTs them into local records. Returns the number of rows seen.
func (e *Engine) Pull(modelName string) (int, error) {
	since := e.getCursor(modelName)
	url := fmt.Sprintf("%s/sync/pull?model=%s", e.APIURL, modelName)
	if since != "" {
		url += "&since=" + since
	}

	body, err := e.doGET(url)
	if err != nil {
		return 0, err
	}

	var resp struct {
		Data   []map[string]interface{} `json:"data"`
		Cursor string                   `json:"cursor"`
		Count  int                      `json:"count"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return 0, fmt.Errorf("decoding pull response: %w", err)
	}

	for _, row := range resp.Data {
		id, _ := row["id"].(string)
		if id == "" {
			continue
		}
		version, _ := toInt(row["version"])
		raw, err := json.Marshal(row)
		if err != nil {
			continue
		}
		updatedAt := time.Now().Unix()
		if u, ok := row["updated_at"].(string); ok {
			if t, err := time.Parse(time.RFC3339Nano, u); err == nil {
				updatedAt = t.Unix()
			}
		}
		rec := Record{
			Model:     modelName,
			ID:        id,
			Data:      raw,
			Version:   version,
			UpdatedAt: updatedAt,
		}
		// UPSERT: pulled state always wins over the cached version.
		if err := e.DB.Save(&rec).Error; err != nil {
			return 0, err
		}
	}
	if resp.Cursor != "" {
		e.setCursor(modelName, resp.Cursor)
	}
	return resp.Count, nil
}

// PushBatch is the JSON shape /api/sync/push expects.
type PushBatch struct {
	Changes []PushChange `json:"changes"`
}

// PushChange mirrors the server's PushChange.
type PushChange struct {
	Op      string                 `json:"op"`
	Model   string                 `json:"model"`
	ID      string                 `json:"id"`
	Version int                    `json:"version"`
	Data    map[string]interface{} `json:"data"`
}

// PushResult mirrors the server's PushResult.
type PushResult struct {
	OK            bool                   `json:"ok"`
	Code          string                 `json:"code,omitempty"`
	Message       string                 `json:"message,omitempty"`
	ServerVersion int                    `json:"server_version,omitempty"`
	ServerData    map[string]interface{} `json:"server_data,omitempty"`
	NewVersion    int                    `json:"new_version,omitempty"`
}

// Push drains the outbox into a single /api/sync/push call and applies
// each per-entry result. Successful entries are removed from the outbox
// and the local record is marked synced. Conflicts stay in the outbox
// with HasConflict=true and the server state attached so the UI can
// drive a merge dialog.
//
// Returns (pushed, conflicts, err).
func (e *Engine) Push() (int, int, error) {
	// Skip rows that already have an unresolved conflict — the user has
	// to resolve those via ResolveConflict before they're tried again.
	var entries []Outbox
	if err := e.DB.Where("has_conflict = 0").Order("created_at asc").Find(&entries).Error; err != nil {
		return 0, 0, err
	}
	if len(entries) == 0 {
		return 0, 0, nil
	}

	batch := PushBatch{Changes: make([]PushChange, 0, len(entries))}
	for _, en := range entries {
		var data map[string]interface{}
		if len(en.Data) > 0 {
			_ = json.Unmarshal(en.Data, &data)
		}
		batch.Changes = append(batch.Changes, PushChange{
			Op:      en.Op,
			Model:   en.Model,
			ID:      en.EntityID,
			Version: en.Version,
			Data:    data,
		})
	}

	body, err := e.doPOST(e.APIURL+"/sync/push", batch)
	if err != nil {
		return 0, 0, err
	}

	var resp struct {
		Results []PushResult `json:"results"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return 0, 0, fmt.Errorf("decoding push response: %w", err)
	}
	if len(resp.Results) != len(entries) {
		return 0, 0, fmt.Errorf("push: server returned %d results for %d changes", len(resp.Results), len(entries))
	}

	pushed := 0
	conflicts := 0
	for i, r := range resp.Results {
		en := entries[i]
		switch {
		case r.OK:
			// Remove the outbox entry; mark the local record at the new version.
			if err := e.DB.Delete(&en).Error; err != nil {
				return pushed, conflicts, err
			}
			if en.Op == "delete" {
				e.DB.Where("model = ? AND id = ?", en.Model, en.EntityID).Delete(&Record{})
			} else {
				e.DB.Model(&Record{}).
					Where("model = ? AND id = ?", en.Model, en.EntityID).
					Updates(map[string]interface{}{"version": r.NewVersion})
			}
			pushed++

		case r.Code == "VERSION_CONFLICT":
			// Stash the server state on the outbox row for the UI.
			serverDataJSON, _ := json.Marshal(r.ServerData)
			e.DB.Model(&en).Updates(map[string]interface{}{
				"has_conflict":   true,
				"server_data":    serverDataJSON,
				"server_version": r.ServerVersion,
				"conflict_msg":   r.Message,
			})
			conflicts++

		default:
			// Other errors leave the entry alone; user can retry later.
			e.DB.Model(&en).Update("conflict_msg", fmt.Sprintf("%s: %s", r.Code, r.Message))
		}
	}
	return pushed, conflicts, nil
}

// ResolveConflict accepts the user's merge for one conflicted entity.
// mergedData becomes the new outbox payload; serverVersion is the
// version the user is overwriting (so the next push uses If-Match
// semantics correctly). Clears HasConflict so the entry is replayed
// on the next Push.
func (e *Engine) ResolveConflict(tableName, entityID string, mergedData map[string]interface{}, serverVersion int) error {
	dataJSON, err := json.Marshal(mergedData)
	if err != nil {
		return err
	}
	res := e.DB.Model(&Outbox{}).
		Where("model = ? AND entity_id = ?", tableName, entityID).
		Updates(map[string]interface{}{
			"data":           dataJSON,
			"version":        serverVersion,
			"has_conflict":   false,
			"server_data":    nil,
			"server_version": 0,
			"conflict_msg":   "",
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("no outbox entry for %s:%s", tableName, entityID)
	}
	// Also update the local record so reads see the merged state immediately.
	return e.DB.Model(&Record{}).
		Where("model = ? AND id = ?", tableName, entityID).
		Updates(map[string]interface{}{"data": dataJSON, "version": serverVersion}).Error
}

// PendingCount returns how many outbox entries are waiting (used to
// drive the title-bar badge).
func (e *Engine) PendingCount() (int64, error) {
	var n int64
	err := e.DB.Model(&Outbox{}).Count(&n).Error
	return n, err
}

// GetPendingChanges returns every outbox entry, oldest first, for the
// "review what's about to push" panel.
func (e *Engine) GetPendingChanges() ([]Outbox, error) {
	var entries []Outbox
	err := e.DB.Order("created_at asc").Find(&entries).Error
	return entries, err
}

func (e *Engine) doGET(url string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	if err := e.attachAuth(req); err != nil {
		return nil, err
	}
	return e.do(req)
}

func (e *Engine) doPOST(url string, payload interface{}) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if err := e.attachAuth(req); err != nil {
		return nil, err
	}
	return e.do(req)
}

func (e *Engine) attachAuth(req *http.Request) error {
	if e.GetToken == nil {
		return nil
	}
	tok, err := e.GetToken()
	if err != nil {
		return err
	}
	if tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
	}
	return nil
}

func (e *Engine) do(req *http.Request) ([]byte, error) {
	resp, err := e.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("api %s: %d: %s", req.URL.Path, resp.StatusCode, string(body))
	}
	return body, nil
}

func (e *Engine) getCursor(model string) string {
	e.cursorsMu.RLock()
	c, ok := e.cursors[model]
	e.cursorsMu.RUnlock()
	if ok {
		return c
	}
	var row Cursor
	if err := e.DB.First(&row, "model = ?", model).Error; err == nil {
		e.cursorsMu.Lock()
		e.cursors[model] = row.Value
		e.cursorsMu.Unlock()
		return row.Value
	}
	return ""
}

func (e *Engine) setCursor(model, value string) {
	e.cursorsMu.Lock()
	e.cursors[model] = value
	e.cursorsMu.Unlock()
	e.DB.Save(&Cursor{Model: model, Value: value})
}

func toInt(v interface{}) (int, bool) {
	switch x := v.(type) {
	case float64:
		return int(x), true
	case int:
		return x, true
	case int64:
		return int(x), true
	}
	return 0, false
}
