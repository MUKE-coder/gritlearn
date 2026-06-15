package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Updater handles in-app auto-update for the Wails desktop app.
// Exposed to the React side via Wails Bind so the UI can:
//
//	StartDownload(url, version)  → kicks off a background fetch to %TEMP%
//	GetProgress()                → polled ~2x/sec for the progress bar
//	CancelDownload()             → abort the in-flight download
//	InstallAndRestart()          → swap the binary and relaunch
//
// The binary swap uses the Windows trick: rename the running .exe to
// .exe.old (allowed even while locked, because Windows holds the file
// open for read/exec but lets the directory entry move), copy the new
// exe into the original location, spawn it, then exit. On the next
// startup, the new process removes the leftover .old in a background
// goroutine (retries because the old process may not have released the
// handle yet).
type Updater struct {
	ctx context.Context

	mu      sync.RWMutex
	status  string // idle | downloading | downloaded | installing | error
	target  string // path to the downloaded .exe
	version string // release version being downloaded
	errMsg  string // last error message

	bytesDownloaded atomic.Int64
	bytesTotal      atomic.Int64

	cancel context.CancelFunc
}

// UpdaterState is the JSON-serialisable snapshot the frontend reads
// each tick to render the modal. Field names match the React side.
type UpdaterState struct {
	Status          string `json:"status"`
	Version         string `json:"version"`
	BytesDownloaded int64  `json:"bytesDownloaded"`
	BytesTotal      int64  `json:"bytesTotal"`
	Error           string `json:"error,omitempty"`
}

func NewUpdater() *Updater {
	return &Updater{status: "idle"}
}

// SetContext is called by app.go's startup hook so the updater can
// emit Wails events + drive the Quit on install.
func (u *Updater) SetContext(ctx context.Context) {
	u.ctx = ctx
}

// CleanupOldOnStartup removes the .exe.old left behind by a previous
// in-app update. Best-effort: if the old process is still holding the
// handle briefly we retry a handful of times. Called via a goroutine
// so app startup isn't blocked.
func (u *Updater) CleanupOldOnStartup() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	old := exe + ".old"
	if _, err := os.Stat(old); errors.Is(err, os.ErrNotExist) {
		return
	}
	for i := 0; i < 25; i++ {
		if err := os.Remove(old); err == nil || errors.Is(err, os.ErrNotExist) {
			return
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func (u *Updater) setStatus(s string) {
	u.mu.Lock()
	u.status = s
	u.mu.Unlock()
}

// GetProgress returns the snapshot the frontend's polling loop reads.
// Pure read-side; never mutates state.
func (u *Updater) GetProgress() UpdaterState {
	u.mu.RLock()
	defer u.mu.RUnlock()
	return UpdaterState{
		Status:          u.status,
		Version:         u.version,
		BytesDownloaded: u.bytesDownloaded.Load(),
		BytesTotal:      u.bytesTotal.Load(),
		Error:           u.errMsg,
	}
}

// StartDownload kicks off the .exe fetch in a goroutine. Returns
// immediately. Idempotent — calling it while a download is already
// in flight returns an error rather than starting a second one.
func (u *Updater) StartDownload(url, version string) error {
	if url == "" {
		return errors.New("download url is empty")
	}
	if version == "" {
		return errors.New("version is empty")
	}

	u.mu.Lock()
	if u.status == "downloading" {
		u.mu.Unlock()
		return errors.New("download already in progress")
	}
	ctx, cancel := context.WithCancel(context.Background())
	u.cancel = cancel
	u.status = "downloading"
	u.version = version
	u.errMsg = ""
	u.target = ""
	u.bytesDownloaded.Store(0)
	u.bytesTotal.Store(0)
	u.mu.Unlock()

	go u.downloadWorker(ctx, url, version)
	return nil
}

func (u *Updater) downloadWorker(ctx context.Context, url, version string) {
	fail := func(err error) {
		u.mu.Lock()
		u.status = "error"
		u.errMsg = err.Error()
		u.mu.Unlock()
		if u.ctx != nil {
			runtime.EventsEmit(u.ctx, "updater:error", err.Error())
		}
	}

	tmpDir := os.TempDir()
	partial := filepath.Join(tmpDir, fmt.Sprintf("JEditor-v%s.exe.partial", version))
	final := filepath.Join(tmpDir, fmt.Sprintf("JEditor-v%s.exe", version))

	// Clean up leftovers from a previous failed attempt.
	_ = os.Remove(partial)
	_ = os.Remove(final)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		fail(err)
		return
	}
	// Follow redirects (the API's /api/desktop/download returns a 302 to
	// a presigned GitHub CDN URL). Go's default client follows redirects;
	// we just need to make sure we don't override that with a custom one
	// that doesn't.
	client := &http.Client{
		// No overall timeout — the .exe is ~30 MB and we want this to
		// work on shaky links. The context-driven cancellation handles
		// the "user gave up" path.
		Timeout: 0,
	}
	resp, err := client.Do(req)
	if err != nil {
		fail(err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		fail(fmt.Errorf("download HTTP %d", resp.StatusCode))
		return
	}

	u.bytesTotal.Store(resp.ContentLength)

	out, err := os.Create(partial)
	if err != nil {
		fail(err)
		return
	}

	prog := &progressWriter{u: u}
	if _, err := io.Copy(out, io.TeeReader(resp.Body, prog)); err != nil {
		out.Close()
		_ = os.Remove(partial)
		if ctx.Err() != nil {
			// User cancelled — soft-land at idle.
			u.mu.Lock()
			u.status = "idle"
			u.mu.Unlock()
			return
		}
		fail(err)
		return
	}
	if err := out.Close(); err != nil {
		fail(err)
		return
	}

	if err := os.Rename(partial, final); err != nil {
		fail(err)
		return
	}

	u.mu.Lock()
	u.status = "downloaded"
	u.target = final
	u.mu.Unlock()
	if u.ctx != nil {
		runtime.EventsEmit(u.ctx, "updater:downloaded", final)
	}
}

type progressWriter struct {
	u *Updater
}

func (p *progressWriter) Write(b []byte) (int, error) {
	p.u.bytesDownloaded.Add(int64(len(b)))
	return len(b), nil
}

// CancelDownload aborts an in-flight download. Safe to call when
// nothing's running.
func (u *Updater) CancelDownload() {
	u.mu.Lock()
	if u.cancel != nil {
		u.cancel()
	}
	u.mu.Unlock()
}

// InstallAndRestart swaps the binary and relaunches the new one.
// Returns immediately on success — the current process exits ~250ms
// later via runtime.Quit so the modal closes cleanly before the
// window disappears.
func (u *Updater) InstallAndRestart() error {
	u.mu.Lock()
	src := u.target
	curStatus := u.status
	u.mu.Unlock()

	if curStatus != "downloaded" || src == "" {
		return fmt.Errorf("no completed download to install (status=%s)", curStatus)
	}
	u.setStatus("installing")

	currentExe, err := os.Executable()
	if err != nil {
		u.setStatus("error")
		return fmt.Errorf("resolving current exe: %w", err)
	}

	oldPath := currentExe + ".old"
	_ = os.Remove(oldPath)

	if err := os.Rename(currentExe, oldPath); err != nil {
		u.setStatus("error")
		return fmt.Errorf("renaming current exe: %w", err)
	}

	// Copy across volumes — %TEMP% and the install dir are often on
	// different drives. Rollback on failure.
	if err := copyFile(src, currentExe); err != nil {
		_ = os.Rename(oldPath, currentExe)
		u.setStatus("error")
		return fmt.Errorf("copying new exe: %w", err)
	}
	_ = os.Remove(src)

	cmd := exec.Command(currentExe)
	cmd.Stdout = nil
	cmd.Stderr = nil
	cmd.Stdin = nil
	if err := cmd.Start(); err != nil {
		u.setStatus("error")
		return fmt.Errorf("starting new version: %w", err)
	}

	go func() {
		time.Sleep(250 * time.Millisecond)
		if u.ctx != nil {
			runtime.Quit(u.ctx)
		} else {
			os.Exit(0)
		}
	}()
	return nil
}

// copyFile is a no-frills file copy. Used because %TEMP% (where the
// downloaded .exe lives) and the install dir are usually on different
// volumes — os.Rename would fail with EXDEV across volumes.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o755)
	if err != nil {
		return err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Close()
}
