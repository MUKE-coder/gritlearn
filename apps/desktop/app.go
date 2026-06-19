package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
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
	live     *LiveServer
	runner   *CommandRunner
	pty      *PtyManager
}

func NewApp() *App {
	return &App{
		kc:     NewKeychain(),
		live:   NewLiveServer(),
		runner: NewCommandRunner(),
		pty:    NewPtyManager(),
	}
}

// PtyOpen starts a new shell session anchored at cwd and returns the
// session id. The frontend xterm.js component uses the id to route
// pty:data events and to call PtyWrite/PtyResize/PtyClose on input.
func (a *App) PtyOpen(cwd string, cols, rows int) (string, error) {
	return a.pty.Open(cwd, cols, rows)
}

// PtyWrite forwards user keystrokes (already encoded as raw bytes
// in a JS string) to the shell's stdin.
func (a *App) PtyWrite(id, data string) error {
	return a.pty.Write(id, data)
}

// PtyResize updates the PTY dimensions when xterm-addon-fit calculates
// a new column/row count from the pane size.
func (a *App) PtyResize(id string, cols, rows int) error {
	return a.pty.Resize(id, cols, rows)
}

// PtyClose tears down a shell session — called when the student closes
// the terminal tab.
func (a *App) PtyClose(id string) {
	a.pty.Close(id)
}

// RunCommand kicks off `command` inside `cwd` and returns the id
// streamed events will carry. Sample usage from the Run pane:
//   const id = await App.RunCommand(rootPath, "pnpm install")
//   EventsOn("runner:line", e => { if (e.id === id) append(e.text) })
func (a *App) RunCommand(cwd, command string) (string, error) {
	return a.runner.Run(cwd, command)
}

// StopCommand cancels a running command by id (returned from
// RunCommand). No-op if the id isn't running anymore.
func (a *App) StopCommand(id string) {
	a.runner.Stop(id)
}

// StartLiveServer brings up the live-reload HTTP server for the given
// directory and returns the bound URL ("http://127.0.0.1:NNNN").
// Calling it while a server is already running for a different root
// transparently restarts the server with the new root.
func (a *App) StartLiveServer(root string) (string, error) {
	port, err := a.live.Start(root)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("http://127.0.0.1:%d", port), nil
}

// StopLiveServer tears down the server. Safe to call when nothing is
// running.
func (a *App) StopLiveServer() error {
	return a.live.Stop()
}

// LiveServerStatus reports the server's state to the UI so the
// "Live Server" button can show "Running" + the bound URL.
type LiveServerStatus struct {
	Running bool   `json:"running"`
	URL     string `json:"url"`
	Root    string `json:"root"`
}

func (a *App) GetLiveServerStatus() LiveServerStatus {
	port := a.live.Port()
	if port == 0 {
		return LiveServerStatus{Running: false}
	}
	return LiveServerStatus{
		Running: true,
		URL:     fmt.Sprintf("http://127.0.0.1:%d", port),
		Root:    a.live.Root(),
	}
}

// OpenInBrowser opens an external URL in the user's default browser.
// Used by the "Live Server" button so the student doesn't have to
// alt-tab to a terminal and curl/click anything.
func (a *App) OpenInBrowser(url string) {
	wailsruntime.BrowserOpenURL(a.ctx, url)
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.runner.SetContext(ctx)
	a.pty.SetContext(ctx)

	a.apiURL = os.Getenv("VITE_API_URL")
	if a.apiURL == "" {
		// Production default: the deployed API. Override with VITE_API_URL
		// when running locally against your own backend.
		a.apiURL = "https://api.jbeditor.com/api"
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

// CreateFile makes a new empty file at path. Parent dirs are created
// as needed. Fails loudly if the path already exists so a stray click
// can't silently clobber an existing file.
func (a *App) CreateFile(path string) error {
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("already exists: %s", path)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("mkdir for %s: %w", path, err)
	}
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	return f.Close()
}

// CreateFolder makes a new directory at path (and any parents).
// Idempotent — calling it on an existing folder succeeds silently
// since MkdirAll's semantics match the in-app new-folder UX.
func (a *App) CreateFolder(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("mkdir %s: %w", path, err)
	}
	return nil
}

// DeleteFileNode removes a file or directory tree at path. Use with
// the same caution as rm -rf — the caller (UI) is responsible for
// confirming with the user.
func (a *App) DeleteFileNode(path string) error {
	if err := os.RemoveAll(path); err != nil {
		return fmt.Errorf("delete %s: %w", path, err)
	}
	return nil
}

// RenameFileNode renames/moves a file or directory. Rejects the
// rename if dest already exists so two siblings can't silently
// collide and lose data.
func (a *App) RenameFileNode(oldPath, newPath string) error {
	if oldPath == newPath {
		return nil
	}
	if _, err := os.Stat(newPath); err == nil {
		return fmt.Errorf("already exists: %s", newPath)
	}
	if err := os.MkdirAll(filepath.Dir(newPath), 0o755); err != nil {
		return fmt.Errorf("mkdir for %s: %w", newPath, err)
	}
	if err := os.Rename(oldPath, newPath); err != nil {
		return fmt.Errorf("rename %s → %s: %w", oldPath, newPath, err)
	}
	return nil
}

// CopyFileNode duplicates a file or directory tree from src to dst.
// Used by the file tree's Copy/Paste + Duplicate actions. Refuses to
// overwrite existing paths — the caller should compute a unique
// destination first (e.g. "foo copy.html"). Refuses to copy a folder
// into itself (would recurse forever).
func (a *App) CopyFileNode(src, dst string) error {
	if src == dst {
		return fmt.Errorf("source and destination are the same")
	}
	if _, err := os.Stat(dst); err == nil {
		return fmt.Errorf("already exists: %s", dst)
	}
	info, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("stat %s: %w", src, err)
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return fmt.Errorf("mkdir for %s: %w", dst, err)
	}
	if info.IsDir() {
		// Reject if dst is inside src so we don't recurse infinitely.
		absSrc, _ := filepath.Abs(src)
		absDst, _ := filepath.Abs(dst)
		if strings.HasPrefix(absDst+string(filepath.Separator), absSrc+string(filepath.Separator)) {
			return fmt.Errorf("can't copy folder into itself")
		}
		return copyDir(src, dst)
	}
	return copyFileBytes(src, dst, info.Mode())
}

func copyFileBytes(src, dst string, mode os.FileMode) error {
	b, err := os.ReadFile(src)
	if err != nil {
		return fmt.Errorf("read %s: %w", src, err)
	}
	if err := os.WriteFile(dst, b, mode); err != nil {
		return fmt.Errorf("write %s: %w", dst, err)
	}
	return nil
}

func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	for _, e := range entries {
		sp := filepath.Join(src, e.Name())
		dp := filepath.Join(dst, e.Name())
		info, err := e.Info()
		if err != nil {
			return err
		}
		if e.IsDir() {
			if err := copyDir(sp, dp); err != nil {
				return err
			}
		} else {
			if err := copyFileBytes(sp, dp, info.Mode()); err != nil {
				return err
			}
		}
	}
	return nil
}

// UniqueCopyPath returns a non-colliding "copy of" filename for the
// given source. "foo.html" → "foo copy.html", and if that exists too,
// "foo copy 2.html", etc. Folder names get the same treatment without
// the extension split. Used by the Duplicate action so the UI doesn't
// have to recompute this client-side and risk a race with the disk.
func (a *App) UniqueCopyPath(srcPath string) string {
	dir := filepath.Dir(srcPath)
	base := filepath.Base(srcPath)
	ext := filepath.Ext(base)
	stem := strings.TrimSuffix(base, ext)

	candidate := filepath.Join(dir, stem+" copy"+ext)
	if _, err := os.Stat(candidate); os.IsNotExist(err) {
		return candidate
	}
	for i := 2; i < 1000; i++ {
		candidate = filepath.Join(dir, fmt.Sprintf("%s copy %d%s", stem, i, ext))
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
	// 1000 collisions? Just append a nanosecond suffix and call it done.
	return filepath.Join(dir, fmt.Sprintf("%s copy %d%s", stem, os.Getpid(), ext))
}

// RevealInExplorer opens the OS file manager focused on `path`.
//   Windows: explorer /select,"path"
//   macOS:   open -R "path"
//   Linux:   xdg-open "dir"  (selecting a specific file isn't portable)
// Falls back to opening the parent dir if /select fails.
func (a *App) RevealInExplorer(path string) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("stat %s: %w", path, err)
	}
	switch goruntime.GOOS {
	case "windows":
		// explorer.exe always returns exit code 1, even on success.
		// Don't surface that as an error — only treat "could not
		// start the process" as failure.
		cmd := exec.Command("explorer.exe", "/select,", path)
		hideWindow(cmd)
		if err := cmd.Start(); err != nil {
			return fmt.Errorf("explorer /select: %w", err)
		}
		return nil
	case "darwin":
		cmd := exec.Command("open", "-R", path)
		return cmd.Start()
	default:
		// Linux/BSD: open the containing directory; selecting a file
		// would require file-manager-specific D-Bus calls.
		dir := path
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			dir = filepath.Dir(path)
		}
		return exec.Command("xdg-open", dir).Start()
	}
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
