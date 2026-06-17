package main

// LiveServer — a tiny dev HTTP server for the currently-open workspace
// folder. Used for the Phase 1 (HTML/CSS/JS) lessons where students
// hit "Live Server" on an index.html and want to see it in the
// browser without configuring anything.
//
// Two endpoints:
//   GET <any path>         → static file under root
//   GET /__jeditor__/reload → SSE stream; emits "reload" on disk change
//
// HTML responses get a tiny client script injected at the bottom of
// <body> that subscribes to the SSE stream and triggers a full
// reload when it fires. No fsnotify dependency — we poll the root
// at 600ms intervals and remember every file's mtime. Cheap enough
// for a teaching workspace of <500 files; if we ever ship a real
// project tree we'll swap to fsnotify.

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	liveReloadSSEPath = "/__jeditor__/reload"
	liveReloadClient  = `<script>(function(){
  if (window.__jeditorLiveReload) return;
  window.__jeditorLiveReload = true;
  var es = new EventSource("/__jeditor__/reload");
  es.addEventListener("reload", function(){ location.reload(); });
  es.onerror = function(){
    // Drop reconnection storm if the server is gone — back off 2s.
    try { es.close(); } catch(e){}
    setTimeout(function(){ window.location.reload(); }, 2000);
  };
})();</script>`
)

// LiveServer keeps a single running HTTP server tied to one root
// directory at a time. Calling Start while another root is already
// served stops the old one first.
type LiveServer struct {
	mu        sync.Mutex
	srv       *http.Server
	root      string
	port      int
	clients   map[chan string]struct{}
	clientsMu sync.Mutex
	cancel    context.CancelFunc
	mtimes    map[string]time.Time
}

// NewLiveServer constructs an idle server. Use Start to bring it up.
func NewLiveServer() *LiveServer {
	return &LiveServer{
		clients: map[chan string]struct{}{},
		mtimes:  map[string]time.Time{},
	}
}

// Start launches the server on a random free port serving `root`.
// Returns the chosen port so the frontend can show + open it.
func (ls *LiveServer) Start(root string) (int, error) {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	if ls.srv != nil {
		// Already running for another root → stop and restart.
		_ = ls.stopLocked()
	}

	info, err := os.Stat(root)
	if err != nil || !info.IsDir() {
		return 0, fmt.Errorf("invalid root: %s", root)
	}

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("listen: %w", err)
	}
	port := ln.Addr().(*net.TCPAddr).Port

	mux := http.NewServeMux()
	mux.HandleFunc(liveReloadSSEPath, ls.handleSSE)
	mux.HandleFunc("/", ls.handleStatic)

	ls.srv = &http.Server{Handler: mux}
	ls.root = root
	ls.port = port

	go func() {
		_ = ls.srv.Serve(ln)
	}()

	// Reset the mtime map so we don't fire a stale "reload" on first
	// poll. Seed it with the current state of the tree.
	ls.mtimes = map[string]time.Time{}
	ls.snapshotInto(ls.mtimes)

	// Kick off the change watcher.
	ctx, cancel := context.WithCancel(context.Background())
	ls.cancel = cancel
	go ls.watchLoop(ctx)

	return port, nil
}

// Stop tears down the HTTP server, cancels the watcher, and closes
// any open SSE client streams.
func (ls *LiveServer) Stop() error {
	ls.mu.Lock()
	defer ls.mu.Unlock()
	return ls.stopLocked()
}

func (ls *LiveServer) stopLocked() error {
	if ls.srv == nil {
		return nil
	}
	if ls.cancel != nil {
		ls.cancel()
	}
	// Drain SSE clients so handleSSE returns and frees its goroutine.
	ls.clientsMu.Lock()
	for ch := range ls.clients {
		close(ch)
		delete(ls.clients, ch)
	}
	ls.clientsMu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	err := ls.srv.Shutdown(ctx)
	ls.srv = nil
	ls.root = ""
	ls.port = 0
	return err
}

// Port returns the currently-bound port, or 0 if not running.
func (ls *LiveServer) Port() int {
	ls.mu.Lock()
	defer ls.mu.Unlock()
	return ls.port
}

// Root returns the directory currently being served, or "" if idle.
func (ls *LiveServer) Root() string {
	ls.mu.Lock()
	defer ls.mu.Unlock()
	return ls.root
}

// handleStatic serves files under root, injecting the live-reload
// script into HTML responses. Path-traversal attempts (../) are
// neutralised by filepath.Clean + a prefix check.
func (ls *LiveServer) handleStatic(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimPrefix(r.URL.Path, "/")
	if rel == "" {
		rel = "index.html"
	}
	abs := filepath.Join(ls.root, filepath.FromSlash(rel))
	cleanRoot, _ := filepath.Abs(ls.root)
	cleanAbs, _ := filepath.Abs(abs)
	if !strings.HasPrefix(cleanAbs, cleanRoot) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	info, err := os.Stat(abs)
	if err != nil {
		// Directory index fallback.
		http.NotFound(w, r)
		return
	}
	if info.IsDir() {
		idx := filepath.Join(abs, "index.html")
		if _, err := os.Stat(idx); err == nil {
			abs = idx
		} else {
			http.NotFound(w, r)
			return
		}
	}

	ext := strings.ToLower(filepath.Ext(abs))
	if ext == ".html" || ext == ".htm" {
		body, err := os.ReadFile(abs)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		injected := injectReloadScript(string(body))
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		_, _ = io.WriteString(w, injected)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	http.ServeFile(w, r, abs)
}

// injectReloadScript places liveReloadClient right before </body>
// when present, else appends it. Tolerant of malformed HTML — at
// worst the script ends up after </html> and still runs.
func injectReloadScript(html string) string {
	lower := strings.ToLower(html)
	idx := strings.LastIndex(lower, "</body>")
	if idx == -1 {
		return html + liveReloadClient
	}
	return html[:idx] + liveReloadClient + html[idx:]
}

// handleSSE keeps a long-lived connection open and writes a "reload"
// event whenever the watcher fires. Each connected browser tab gets
// its own channel.
func (ls *LiveServer) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := make(chan string, 4)
	ls.clientsMu.Lock()
	ls.clients[ch] = struct{}{}
	ls.clientsMu.Unlock()

	defer func() {
		ls.clientsMu.Lock()
		delete(ls.clients, ch)
		ls.clientsMu.Unlock()
	}()

	// Send a comment line so curl/browser see headers immediately.
	_, _ = fmt.Fprintf(w, ": connected\n\n")
	flusher.Flush()

	for {
		select {
		case <-r.Context().Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			_, _ = fmt.Fprintf(w, "event: %s\ndata: 1\n\n", msg)
			flusher.Flush()
		}
	}
}

// watchLoop polls the root tree at 600ms; on the first change-set
// after a quiet period we broadcast "reload" to every SSE client.
func (ls *LiveServer) watchLoop(ctx context.Context) {
	ticker := time.NewTicker(600 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			next := map[string]time.Time{}
			ls.snapshotInto(next)
			if changed(ls.mtimes, next) {
				ls.mtimes = next
				ls.broadcast("reload")
			}
		}
	}
}

// snapshotInto walks the tree and records each file's mtime. Skips
// node_modules / .git / dist / build — the obvious noise sources
// for a JS workspace, and they'd dwarf the file count we actually
// care about.
func (ls *LiveServer) snapshotInto(into map[string]time.Time) {
	root := ls.root
	if root == "" {
		return
	}
	skip := map[string]bool{
		"node_modules": true, ".git": true, "dist": true,
		"build": true, ".next": true, ".cache": true,
		"target": true, ".turbo": true,
	}
	_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		base := info.Name()
		if info.IsDir() {
			if skip[base] {
				return filepath.SkipDir
			}
			return nil
		}
		into[path] = info.ModTime()
		return nil
	})
}

func changed(before, after map[string]time.Time) bool {
	if len(before) != len(after) {
		return true
	}
	for k, v := range after {
		if bv, ok := before[k]; !ok || !bv.Equal(v) {
			return true
		}
	}
	return false
}

// broadcast pushes a message to every connected SSE client without
// blocking — slow consumers drop the event.
func (ls *LiveServer) broadcast(msg string) {
	ls.clientsMu.Lock()
	defer ls.clientsMu.Unlock()
	for ch := range ls.clients {
		select {
		case ch <- msg:
		default:
			// Channel full — client is slow; skip rather than block
			// the watcher loop on it.
		}
	}
}

// Forwarded to errors package indirectly so the lint stays happy if
// future edits need to compare error wrapping.
var _ = errors.New
