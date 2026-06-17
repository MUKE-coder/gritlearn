package main

// PTY-backed shell sessions for the integrated terminal. Replaces the
// line-based exec runner with a real terminal — students get Ctrl+C,
// signals, ncurses apps (vim, top), arrow-key history in pnpm, the
// whole thing.
//
// Powered by github.com/aymanbagabas/go-pty which wraps ConPTY on
// Windows and openpty on macOS/Linux. Each session is a goroutine
// pump: bytes from PTY → frontend (pty:data), bytes from frontend →
// PTY. On exit we fire pty:exit so the UI can mark the session done.

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	goruntime "runtime"
	"sync"

	"github.com/aymanbagabas/go-pty"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type PtyManager struct {
	ctx      context.Context
	mu       sync.Mutex
	sessions map[string]*ptySession
}

type ptySession struct {
	id     string
	pty    pty.Pty
	cmd    *pty.Cmd
	cancel context.CancelFunc
}

func NewPtyManager() *PtyManager {
	return &PtyManager{sessions: map[string]*ptySession{}}
}

func (m *PtyManager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

// Open starts a new shell session and returns its id. cwd anchors the
// shell's working directory; cols+rows seed the terminal size so the
// shell prints its prompt at the right width.
func (m *PtyManager) Open(cwd string, cols, rows int) (string, error) {
	if m.ctx == nil {
		return "", fmt.Errorf("pty: manager not initialised")
	}
	if cwd == "" {
		// Fall back to home so a brand-new install still opens a usable
		// shell even with no folder selected.
		if h, err := os.UserHomeDir(); err == nil {
			cwd = h
		}
	}
	if cols <= 0 {
		cols = 100
	}
	if rows <= 0 {
		rows = 24
	}

	id, err := randomPtyID()
	if err != nil {
		return "", err
	}

	pt, err := pty.New()
	if err != nil {
		return "", fmt.Errorf("pty: open: %w", err)
	}
	if err := pt.Resize(cols, rows); err != nil {
		_ = pt.Close()
		return "", fmt.Errorf("pty: resize: %w", err)
	}

	shell, args := defaultShell()
	cmd := pt.Command(shell, args...)
	cmd.Dir = cwd
	// Pass through the host environment so PATH, NODE_OPTIONS, etc.
	// behave the way they would in the user's normal terminal.
	cmd.Env = os.Environ()
	if err := cmd.Start(); err != nil {
		_ = pt.Close()
		return "", fmt.Errorf("pty: start %s: %w", shell, err)
	}

	ctx, cancel := context.WithCancel(m.ctx)
	sess := &ptySession{id: id, pty: pt, cmd: cmd, cancel: cancel}

	m.mu.Lock()
	m.sessions[id] = sess
	m.mu.Unlock()

	// Pump PTY → frontend.
	go m.pump(ctx, sess)

	// Watch for process exit.
	go func() {
		err := cmd.Wait()
		errMsg := ""
		if err != nil && err != io.EOF {
			errMsg = err.Error()
		}
		// Cleanly close the PTY so the read loop exits.
		_ = pt.Close()
		cancel()
		m.mu.Lock()
		delete(m.sessions, id)
		m.mu.Unlock()
		wailsruntime.EventsEmit(m.ctx, "pty:exit", map[string]interface{}{
			"id":    id,
			"error": errMsg,
		})
	}()

	return id, nil
}

// Write sends raw bytes to the PTY's stdin. Returns the number of
// bytes written.
func (m *PtyManager) Write(id, data string) error {
	m.mu.Lock()
	sess := m.sessions[id]
	m.mu.Unlock()
	if sess == nil {
		return fmt.Errorf("pty: no session %s", id)
	}
	_, err := sess.pty.Write([]byte(data))
	return err
}

// Resize updates the PTY's terminal dimensions so programs (vim, top,
// node REPL line editor) re-flow their UI.
func (m *PtyManager) Resize(id string, cols, rows int) error {
	m.mu.Lock()
	sess := m.sessions[id]
	m.mu.Unlock()
	if sess == nil {
		return fmt.Errorf("pty: no session %s", id)
	}
	if cols <= 0 {
		cols = 100
	}
	if rows <= 0 {
		rows = 24
	}
	return sess.pty.Resize(cols, rows)
}

// Close tears down a session. Idempotent — closing an unknown id is a
// no-op.
func (m *PtyManager) Close(id string) {
	m.mu.Lock()
	sess := m.sessions[id]
	delete(m.sessions, id)
	m.mu.Unlock()
	if sess == nil {
		return
	}
	sess.cancel()
	_ = sess.pty.Close()
}

// CloseAll fires at app shutdown so we don't orphan shell processes.
func (m *PtyManager) CloseAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, sess := range m.sessions {
		sess.cancel()
		_ = sess.pty.Close()
		delete(m.sessions, id)
	}
}

// pump streams PTY output to the frontend until either the PTY
// closes or the context is cancelled.
func (m *PtyManager) pump(ctx context.Context, sess *ptySession) {
	buf := make([]byte, 4096)
	for {
		// Read blocks until data arrives or PTY closes; honour ctx by
		// closing the PTY from Close() above, which makes Read return.
		select {
		case <-ctx.Done():
			return
		default:
		}
		n, err := sess.pty.Read(buf)
		if n > 0 {
			wailsruntime.EventsEmit(m.ctx, "pty:data", map[string]interface{}{
				"id":   sess.id,
				"data": string(buf[:n]),
			})
		}
		if err != nil {
			return
		}
	}
}

// defaultShell picks the user's preferred interactive shell. We
// inspect the SHELL env var on Unix so $SHELL=/bin/zsh wins; on
// Windows we use PowerShell because it ships everywhere.
func defaultShell() (string, []string) {
	if goruntime.GOOS == "windows" {
		// pwsh.exe is preferred when installed (newer, cross-platform
		// PowerShell), but powershell.exe is the safe default.
		return "powershell.exe", []string{"-NoLogo"}
	}
	if s := os.Getenv("SHELL"); s != "" {
		return s, []string{"-l"}
	}
	return "/bin/bash", []string{"-l"}
}

func randomPtyID() (string, error) {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "pty_" + hex.EncodeToString(b), nil
}
