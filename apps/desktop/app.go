package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	goruntime "runtime"
	"sort"
	"strings"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"gritlearn/apps/desktop/progress"
	"gritlearn/apps/desktop/sync"
)

// App exposes native OS methods + the offline-first stores to the React
// frontend via Wails bindings. Online business logic still goes through
// HTTP to the shared API; offline-first writes go through the Local*
// methods below, which queue them in the sync engine's outbox until the
// user explicitly clicks "Sync".
//
// The progress store is intentionally separate from sync.Engine: it has
// one table, a fixed schema, and binds cleanly to TypeScript. B8's sync
// pass will reach into progress.Store directly to push Dirty rows.
type App struct {
	ctx      context.Context
	kc       *Keychain
	sync     *sync.Engine
	progress *progress.Store
	apiURL   string
}

func NewApp() *App {
	return &App{
		kc: NewKeychain(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	a.apiURL = os.Getenv("VITE_API_URL")
	if a.apiURL == "" {
		a.apiURL = "http://localhost:8080/api"
	}
	dataDir, err := os.UserConfigDir()
	if err != nil {
		dataDir, _ = os.UserHomeDir()
	}
	appDir := filepath.Join(dataDir, "gritlearn")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		log.Printf("[startup] mkdir %s: %v", appDir, err)
	}

	// Generic sync engine (scaffold), kept for future per-table sync.
	syncPath := filepath.Join(appDir, "sync.db")
	engine, err := sync.Open(syncPath, a.apiURL, func() (string, error) {
		v, _ := a.kc.Get("access_token")
		return v, nil
	})
	if err != nil {
		log.Printf("[sync] open failed: %v", err)
	} else {
		a.sync = engine
	}

	// Progress store — the local-first mirror of the server Progress
	// table. Failing to open it is loud (we log) but not fatal: the
	// curriculum still renders, students just see empty progress dots.
	progressPath := filepath.Join(appDir, "progress.db")
	pstore, err := progress.Open(progressPath)
	if err != nil {
		log.Printf("[progress] open failed: %v", err)
	} else {
		a.progress = pstore
		log.Printf("[progress] store ready at %s", progressPath)
	}
}

// ─── Token storage (OS keychain) ──────────────────────────────────

func (a *App) SetToken(key, value string) error {
	return a.kc.Set(key, value)
}

func (a *App) GetToken(key string) string {
	v, _ := a.kc.Get(key)
	return v
}

func (a *App) DeleteToken(key string) error {
	return a.kc.Delete(key)
}

// ─── Window controls ──────────────────────────────────────────────

func (a *App) MinimiseWindow()   { wailsruntime.WindowMinimise(a.ctx) }
func (a *App) MaximiseWindow()   { wailsruntime.WindowMaximise(a.ctx) }
func (a *App) UnmaximiseWindow() { wailsruntime.WindowUnmaximise(a.ctx) }
func (a *App) ToggleMaximise()   { wailsruntime.WindowToggleMaximise(a.ctx) }
func (a *App) CloseWindow()      { wailsruntime.Quit(a.ctx) }
func (a *App) IsMaximised() bool { return wailsruntime.WindowIsMaximised(a.ctx) }

// ─── File dialogs ─────────────────────────────────────────────────

func (a *App) OpenFileDialog(title string) (string, error) {
	return wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: title,
	})
}

func (a *App) SaveFileDialog(title, defaultFilename string) (string, error) {
	return wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		Title:           title,
		DefaultFilename: defaultFilename,
	})
}

// OpenDirectoryDialog asks the user to pick a folder. Returns "" if they
// cancel — the frontend treats that as a no-op, not an error.
func (a *App) OpenDirectoryDialog(title string) (string, error) {
	return wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: title,
	})
}

// ─── Local filesystem (curriculum example projects + student workspace) ──
//
// The frontend never speaks raw fs APIs — every disk touch goes through
// these bindings so we can sandbox or audit later if needed. Kept to
// plain strings + a small struct so the Wails TS-binding generator can
// reflect over them cleanly (the time.Time / map[string]interface{} pain
// we hit in B1 stays out of here).

// FileNode is the on-the-wire shape of a single directory entry.
// Children intentionally omitted — the UI lazy-loads each level so a
// student opening their home folder doesn't stall walking node_modules.
type FileNode struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"is_dir"`
}

// ListDirectory returns the immediate children of dir, sorted with
// folders first. Hidden entries (leading dot) and the common heavyweights
// (.git, node_modules, etc) are skipped so the tree stays readable.
func (a *App) ListDirectory(dir string) ([]FileNode, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("list %s: %w", dir, err)
	}

	skip := map[string]bool{
		".git": true, "node_modules": true, ".next": true, "dist": true,
		"build": true, "target": true, ".turbo": true, ".cache": true,
	}

	out := make([]FileNode, 0, len(entries))
	for _, e := range entries {
		name := e.Name()
		if strings.HasPrefix(name, ".") || skip[name] {
			continue
		}
		out = append(out, FileNode{
			Name:  name,
			Path:  filepath.Join(dir, name),
			IsDir: e.IsDir(),
		})
	}

	sort.SliceStable(out, func(i, j int) bool {
		if out[i].IsDir != out[j].IsDir {
			return out[i].IsDir
		}
		return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name)
	})

	return out, nil
}

// ReadFile returns the file content as UTF-8 text. Binaries return an
// error rather than a garbled string — the editor only opens text.
func (a *App) ReadFile(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read %s: %w", path, err)
	}
	return string(b), nil
}

// WriteFile saves content to path, creating parent dirs if needed.
// Atomic-on-rename via a temp file in the same directory so a crash
// mid-write can't corrupt the source file.
func (a *App) WriteFile(path, content string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("mkdir for %s: %w", path, err)
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".gritlearn-write-*")
	if err != nil {
		return fmt.Errorf("temp file for %s: %w", path, err)
	}
	if _, err := tmp.WriteString(content); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return fmt.Errorf("write %s: %w", path, err)
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmp.Name())
		return fmt.Errorf("close temp for %s: %w", path, err)
	}
	if err := os.Rename(tmp.Name(), path); err != nil {
		os.Remove(tmp.Name())
		return fmt.Errorf("rename temp for %s: %w", path, err)
	}
	return nil
}

// FileExists returns true if path resolves to anything (file or dir).
func (a *App) FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// ─── System info ──────────────────────────────────────────────────

// GetPlatform returns "darwin" | "windows" | "linux".
func (a *App) GetPlatform() string {
	return goruntime.GOOS
}

// GetAppVersion returns the build version.
func (a *App) GetAppVersion() string {
	return "0.1.0"
}

// ─── Offline sync (local-first CRUD + push/pull orchestration) ────
//
// Frontend usage:
//   await LocalCreate("buildings", "", { name: "Foo" })   // generates UUID
//   await LocalUpdate("buildings", id, { name: "Bar" })
//   await LocalDelete("buildings", id)
//   const items = await LocalList("buildings")
//   const result = await Sync(["buildings", "tenants"])
//   if (result.conflicts > 0) { /* open conflict dialog */ }
//
// Reads come from the local SQLite mirror, populated by Sync's pull
// phase. Writes are queued in the outbox and only hit the network when
// the user clicks Sync.

func (a *App) LocalCreate(table, id string, data map[string]interface{}) error {
	if a.sync == nil {
		return fmt.Errorf("sync engine not initialized")
	}
	return a.sync.LocalCreate(table, id, data)
}

func (a *App) LocalUpdate(table, id string, data map[string]interface{}) error {
	if a.sync == nil {
		return fmt.Errorf("sync engine not initialized")
	}
	return a.sync.LocalUpdate(table, id, data)
}

func (a *App) LocalDelete(table, id string) error {
	if a.sync == nil {
		return fmt.Errorf("sync engine not initialized")
	}
	return a.sync.LocalDelete(table, id)
}

func (a *App) LocalGet(table, id string) (map[string]interface{}, error) {
	if a.sync == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}
	return a.sync.LocalGet(table, id)
}

func (a *App) LocalList(table string) ([]map[string]interface{}, error) {
	if a.sync == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}
	return a.sync.LocalList(table)
}

// Sync runs Pull (for the listed tables) then Push. Returns counts
// for the UI to render.
func (a *App) Sync(tables []string) (*sync.SyncResult, error) {
	if a.sync == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}
	return a.sync.Sync(tables)
}

// PendingCount returns the number of unpushed entries — wired to the
// title-bar Sync button badge.
func (a *App) PendingCount() (int64, error) {
	if a.sync == nil {
		return 0, nil
	}
	return a.sync.PendingCount()
}

// GetPendingChanges returns the full outbox for the review panel.
func (a *App) GetPendingChanges() ([]sync.Outbox, error) {
	if a.sync == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}
	return a.sync.GetPendingChanges()
}

// ResolveConflict accepts the user's merged data for a conflicted entry.
// serverVersion is the version the user is overwriting (so the next
// push's optimistic-lock check matches). The engine clears HasConflict
// so the entry is replayed on the next Sync.
func (a *App) ResolveConflict(table, entityID string, mergedData map[string]interface{}, serverVersion int) error {
	if a.sync == nil {
		return fmt.Errorf("sync engine not initialized")
	}
	return a.sync.ResolveConflict(table, entityID, mergedData, serverVersion)
}
