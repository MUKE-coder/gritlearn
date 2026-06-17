package main

// CommandRunner — fires-and-streams shell commands so the lesson
// view's Run pane can show "pnpm install", "go run .", etc. without
// us shipping a full PTY (that's a separate, larger effort).
//
// Each Run returns a unique id immediately; the Go side streams
// stdout/stderr lines via Wails events:
//
//   runner:line   { id, stream, text }
//   runner:exit   { id, code, error }
//
// Multiple commands can run concurrently — the runner tracks them
// in a map indexed by id so Stop(id) finds the right process.

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os/exec"
	"runtime"
	"strings"
	"sync"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type CommandRunner struct {
	ctx     context.Context
	mu      sync.Mutex
	running map[string]runningCmd
}

type runningCmd struct {
	cmd    *exec.Cmd
	cancel context.CancelFunc
}

func NewCommandRunner() *CommandRunner {
	return &CommandRunner{
		running: map[string]runningCmd{},
	}
}

func (r *CommandRunner) SetContext(ctx context.Context) {
	r.ctx = ctx
}

// Run launches `command` (interpreted by the shell) inside `cwd`.
// Returns the id assigned to the run, which the UI keeps so it can
// match events back to the right tab + call Stop later.
func (r *CommandRunner) Run(cwd, command string) (string, error) {
	if r.ctx == nil {
		return "", fmt.Errorf("runner not initialised")
	}
	if cwd == "" {
		return "", fmt.Errorf("cwd is required")
	}
	if strings.TrimSpace(command) == "" {
		return "", fmt.Errorf("command is empty")
	}

	id, err := randomID()
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithCancel(r.ctx)
	cmd := exec.CommandContext(ctx, shellFor(command), shellArgsFor(command)...)
	cmd.Dir = cwd
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return "", fmt.Errorf("stdout: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return "", fmt.Errorf("stderr: %w", err)
	}
	if err := cmd.Start(); err != nil {
		cancel()
		return "", fmt.Errorf("start: %w", err)
	}

	r.mu.Lock()
	r.running[id] = runningCmd{cmd: cmd, cancel: cancel}
	r.mu.Unlock()

	go r.streamLines(id, "stdout", stdout)
	go r.streamLines(id, "stderr", stderr)

	go func() {
		err := cmd.Wait()
		r.mu.Lock()
		delete(r.running, id)
		r.mu.Unlock()

		exitCode := 0
		errMsg := ""
		if err != nil {
			errMsg = err.Error()
			if ee, ok := err.(*exec.ExitError); ok {
				exitCode = ee.ExitCode()
			} else {
				exitCode = -1
			}
		}
		wailsruntime.EventsEmit(r.ctx, "runner:exit", map[string]interface{}{
			"id":    id,
			"code":  exitCode,
			"error": errMsg,
		})
	}()

	return id, nil
}

// Stop cancels a running command. Safe to call with an unknown id —
// it's a no-op then.
func (r *CommandRunner) Stop(id string) {
	r.mu.Lock()
	rc, ok := r.running[id]
	r.mu.Unlock()
	if !ok {
		return
	}
	rc.cancel()
}

// StopAll cancels every running command. Called at App shutdown so
// we don't orphan pnpm-dev processes.
func (r *CommandRunner) StopAll() {
	r.mu.Lock()
	defer r.mu.Unlock()
	for id, rc := range r.running {
		rc.cancel()
		delete(r.running, id)
	}
}

func (r *CommandRunner) streamLines(id, stream string, rd io.Reader) {
	scanner := bufio.NewScanner(rd)
	// Long lines from dependency installers are common — bump the
	// scanner buffer up to ~512KB so we don't truncate.
	scanner.Buffer(make([]byte, 0, 64*1024), 512*1024)
	for scanner.Scan() {
		text := scanner.Text()
		wailsruntime.EventsEmit(r.ctx, "runner:line", map[string]interface{}{
			"id":     id,
			"stream": stream,
			"text":   text,
		})
	}
}

// shellFor / shellArgsFor pick the right shell to interpret the
// student's command string. Cross-platform so "pnpm dev && open ..."
// behaves how they'd expect.
func shellFor(_ string) string {
	if runtime.GOOS == "windows" {
		// PowerShell is available on every supported Windows version
		// and handles && + pipes the same way the student sees in
		// every tutorial.
		return "powershell.exe"
	}
	return "/bin/sh"
}

func shellArgsFor(command string) []string {
	if runtime.GOOS == "windows" {
		return []string{"-NoProfile", "-NonInteractive", "-Command", command}
	}
	return []string{"-c", command}
}

func randomID() (string, error) {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
