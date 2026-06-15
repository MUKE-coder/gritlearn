package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritlearn/apps/api/internal/sync"
)

// SyncHandler implements /api/sync/push and /api/sync/pull. The push
// endpoint applies a batch of client changes with per-change version
// checking; the pull endpoint streams server-side updates since a
// caller-supplied cursor.
type SyncHandler struct {
	DB       *gorm.DB
	Registry *sync.Registry
}

// NewSyncHandler wires the handler to the database + model registry.
func NewSyncHandler(db *gorm.DB, reg *sync.Registry) *SyncHandler {
	return &SyncHandler{DB: db, Registry: reg}
}

// PushChange is one entry in a /api/sync/push batch. Op is one of
// "create" / "update" / "delete". Version is the version the client
// believes the server has — mismatches surface as VERSION_CONFLICT.
type PushChange struct {
	Op      string                 `json:"op"`
	Model   string                 `json:"model"`
	ID      string                 `json:"id"`
	Version int                    `json:"version"`
	Data    map[string]interface{} `json:"data"`
}

// PushResult is the per-change result returned in the same order as
// the input batch. On VERSION_CONFLICT, ServerVersion + ServerData
// carry the current server state so the client can build a merge UI.
type PushResult struct {
	OK            bool        `json:"ok"`
	Code          string      `json:"code,omitempty"`
	Message       string      `json:"message,omitempty"`
	ServerVersion int         `json:"server_version,omitempty"`
	ServerData    interface{} `json:"server_data,omitempty"`
	NewVersion    int         `json:"new_version,omitempty"`
}

// Push handles POST /api/sync/push. Each change is applied
// independently — one conflict does not abort the rest of the batch.
func (h *SyncHandler) Push(c *gin.Context) {
	var req struct {
		Changes []PushChange `json:"changes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_BODY", "message": err.Error()}})
		return
	}

	results := make([]PushResult, len(req.Changes))
	for i, ch := range req.Changes {
		results[i] = h.applyChange(ch)
	}
	c.JSON(http.StatusOK, gin.H{"results": results})
}

func (h *SyncHandler) applyChange(ch PushChange) PushResult {
	proto, err := h.Registry.New(ch.Model)
	if err != nil {
		return PushResult{OK: false, Code: "UNKNOWN_MODEL", Message: err.Error()}
	}

	switch ch.Op {
	case "create":
		// Decode the client payload into a fresh model struct and insert.
		// We trust the client-supplied ID (UUID) so the local outbox can
		// keep referring to the same row after the server insert.
		obj := proto
		if err := decodeInto(obj, ch.Data); err != nil {
			return PushResult{OK: false, Code: "DECODE_ERROR", Message: err.Error()}
		}
		setField(obj, "ID", ch.ID)
		if err := h.DB.Create(obj).Error; err != nil {
			return PushResult{OK: false, Code: "CREATE_FAILED", Message: err.Error()}
		}
		return PushResult{OK: true, NewVersion: 1}

	case "update":
		// Versioned update: load current row, compare versions, update if match.
		current := proto
		if err := h.DB.First(current, "id = ?", ch.ID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return PushResult{OK: false, Code: "NOT_FOUND", Message: "row was deleted on the server"}
			}
			return PushResult{OK: false, Code: "INTERNAL_ERROR", Message: err.Error()}
		}
		serverVersion := getIntField(current, "Version")
		if serverVersion != ch.Version {
			return PushResult{
				OK:            false,
				Code:          "VERSION_CONFLICT",
				Message:       fmt.Sprintf("client had v%d, server has v%d", ch.Version, serverVersion),
				ServerVersion: serverVersion,
				ServerData:    current,
			}
		}
		// Versions match — apply the update. The BeforeUpdate hook will
		// bump Version on save so the client knows what to remember.
		if err := h.DB.Model(current).Updates(ch.Data).Error; err != nil {
			return PushResult{OK: false, Code: "UPDATE_FAILED", Message: err.Error()}
		}
		return PushResult{OK: true, NewVersion: serverVersion + 1}

	case "delete":
		current := proto
		if err := h.DB.First(current, "id = ?", ch.ID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Already gone — treat as success so the outbox can clear.
				return PushResult{OK: true}
			}
			return PushResult{OK: false, Code: "INTERNAL_ERROR", Message: err.Error()}
		}
		serverVersion := getIntField(current, "Version")
		if ch.Version != 0 && serverVersion != ch.Version {
			return PushResult{
				OK:            false,
				Code:          "VERSION_CONFLICT",
				Message:       "row was modified after the client's last sync",
				ServerVersion: serverVersion,
				ServerData:    current,
			}
		}
		if err := h.DB.Delete(current, "id = ?", ch.ID).Error; err != nil {
			return PushResult{OK: false, Code: "DELETE_FAILED", Message: err.Error()}
		}
		return PushResult{OK: true}

	default:
		return PushResult{OK: false, Code: "INVALID_OP", Message: "op must be create, update, or delete"}
	}
}

// Pull handles GET /api/sync/pull?since=<rfc3339>&model=<table>. Returns
// every row in the requested table with UpdatedAt > since. The client
// uses the response's cursor as the next ?since value.
func (h *SyncHandler) Pull(c *gin.Context) {
	model := c.Query("model")
	if model == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "MISSING_MODEL", "message": "?model is required"}})
		return
	}
	sinceStr := c.DefaultQuery("since", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "500"))
	if limit < 1 || limit > 5000 {
		limit = 500
	}

	proto, err := h.Registry.New(model)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "UNKNOWN_MODEL", "message": err.Error()}})
		return
	}

	// Build a slice of the right type via reflection so we can return
	// proper struct values (not gin.H maps).
	sliceType := reflect.SliceOf(reflect.TypeOf(proto).Elem())
	results := reflect.New(sliceType)

	q := h.DB.Model(proto)
	if sinceStr != "" {
		t, err := time.Parse(time.RFC3339Nano, sinceStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_SINCE", "message": err.Error()}})
			return
		}
		q = q.Where("updated_at > ?", t)
	}
	if err := q.Order("updated_at asc").Limit(limit).Find(results.Interface()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	// Cursor = last UpdatedAt in the page so the client picks up there
	// next time. Empty when nothing came back.
	cursor := sinceStr
	rs := results.Elem()
	if rs.Len() > 0 {
		last := rs.Index(rs.Len() - 1).Addr().Interface()
		if t, ok := getTimeField(last, "UpdatedAt"); ok {
			cursor = t.Format(time.RFC3339Nano)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   results.Elem().Interface(),
		"cursor": cursor,
		"count":  rs.Len(),
	})
}

// decodeInto round-trips a map through JSON into the target struct so
// gorm field tags + types are respected. Cheap; the maps are small.
func decodeInto(target interface{}, data map[string]interface{}) error {
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, target)
}

// setField sets a string field on a struct via reflection. Used for ID.
func setField(obj interface{}, name, value string) {
	v := reflect.ValueOf(obj).Elem()
	f := v.FieldByName(name)
	if f.IsValid() && f.CanSet() && f.Kind() == reflect.String {
		f.SetString(value)
	}
}

func getIntField(obj interface{}, name string) int {
	v := reflect.ValueOf(obj)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	f := v.FieldByName(name)
	if !f.IsValid() {
		return 0
	}
	return int(f.Int())
}

func getTimeField(obj interface{}, name string) (time.Time, bool) {
	v := reflect.ValueOf(obj)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	f := v.FieldByName(name)
	if !f.IsValid() {
		return time.Time{}, false
	}
	t, ok := f.Interface().(time.Time)
	return t, ok
}
