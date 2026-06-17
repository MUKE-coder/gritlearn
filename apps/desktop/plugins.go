package main

// Minimal plugin storage. JEditor plugins are single-file JS bundles
// the user installs from a URL — no marketplace, no zip support, no
// sandbox. The frontend plugin-host runs each plugin via the Function
// constructor with a `JEditor` global the plugin can use to register
// commands, listen for events, etc. (see plugin-host.tsx).
//
// On disk layout: under the user config dir,
//   <configDir>/gritlearn/plugins/<id>/
//     manifest.json   ← author-supplied metadata
//     plugin.js       ← downloaded source
//
// We deliberately keep the surface small. A real extension marketplace
// is months of work and dilutes JEditor's curated-learning promise —
// this is enough for power users to extend the editor without
// requiring us to maintain a registry.

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// PluginManifest mirrors the JSON we expect in manifest.json. id is
// what plugins use to namespace their commands ("com.example.foo");
// duplicate ids overwrite earlier installs on Install.
type PluginManifest struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Author      string   `json:"author"`
	Permissions []string `json:"permissions"`
}

// PluginRecord pairs the manifest with whether the plugin is enabled
// (in which case the host loads it on boot) + the path to its
// bundled JS so the host can fetch and exec it.
type PluginRecord struct {
	Manifest  PluginManifest `json:"manifest"`
	Enabled   bool           `json:"enabled"`
	Source    string         `json:"source"`    // URL it was installed from
	InstalledAt string       `json:"installed_at"`
}

func (a *App) pluginsDir() (string, error) {
	dataDir, err := os.UserConfigDir()
	if err != nil {
		dataDir, _ = os.UserHomeDir()
	}
	dir := filepath.Join(dataDir, "gritlearn", "plugins")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir plugins dir: %w", err)
	}
	return dir, nil
}

// InstallPlugin fetches a single-file JS bundle + accompanying manifest
// from the given URLs and stores both under the plugins dir. The
// manifest URL can be omitted — we then look for a //#jeditor-manifest
// JSON comment at the top of the JS file.
//
// On success returns the parsed manifest so the UI can show its
// metadata immediately.
func (a *App) InstallPlugin(jsURL, manifestURL string) (PluginManifest, error) {
	js, err := fetchURL(jsURL)
	if err != nil {
		return PluginManifest{}, fmt.Errorf("fetch js: %w", err)
	}

	var manifest PluginManifest
	if manifestURL != "" {
		raw, err := fetchURL(manifestURL)
		if err != nil {
			return PluginManifest{}, fmt.Errorf("fetch manifest: %w", err)
		}
		if err := json.Unmarshal(raw, &manifest); err != nil {
			return PluginManifest{}, fmt.Errorf("parse manifest: %w", err)
		}
	} else {
		manifest = extractEmbeddedManifest(string(js))
	}

	if manifest.ID == "" {
		return PluginManifest{}, fmt.Errorf("manifest has no id")
	}
	// id can't traverse paths.
	if strings.ContainsAny(manifest.ID, "/\\") {
		return PluginManifest{}, fmt.Errorf("manifest id must not contain path separators")
	}

	dir, err := a.pluginsDir()
	if err != nil {
		return PluginManifest{}, err
	}
	pluginDir := filepath.Join(dir, manifest.ID)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		return PluginManifest{}, fmt.Errorf("mkdir %s: %w", pluginDir, err)
	}
	if err := os.WriteFile(filepath.Join(pluginDir, "plugin.js"), js, 0o644); err != nil {
		return PluginManifest{}, fmt.Errorf("write plugin.js: %w", err)
	}
	rec := PluginRecord{
		Manifest:    manifest,
		Enabled:     true,
		Source:      jsURL,
		InstalledAt: time.Now().Format(time.RFC3339),
	}
	recBytes, _ := json.MarshalIndent(rec, "", "  ")
	if err := os.WriteFile(filepath.Join(pluginDir, "record.json"), recBytes, 0o644); err != nil {
		return PluginManifest{}, fmt.Errorf("write record: %w", err)
	}
	return manifest, nil
}

// ListPlugins enumerates every directory under plugins/ and reads its
// record.json + plugin.js. Used by the Settings page + plugin-host on
// boot.
func (a *App) ListPlugins() ([]PluginRecord, error) {
	dir, err := a.pluginsDir()
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	out := make([]PluginRecord, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		raw, err := os.ReadFile(filepath.Join(dir, e.Name(), "record.json"))
		if err != nil {
			continue
		}
		var rec PluginRecord
		if err := json.Unmarshal(raw, &rec); err != nil {
			continue
		}
		out = append(out, rec)
	}
	return out, nil
}

// GetPluginCode returns the JS bundle for a plugin id so the host can
// fetch and execute it. Returns the raw source string — no caching
// here; the host caches in-memory after first load.
func (a *App) GetPluginCode(id string) (string, error) {
	dir, err := a.pluginsDir()
	if err != nil {
		return "", err
	}
	js, err := os.ReadFile(filepath.Join(dir, id, "plugin.js"))
	if err != nil {
		return "", err
	}
	return string(js), nil
}

// SetPluginEnabled flips the enabled flag in record.json. The host
// reloads its mounted plugins after this so the change takes effect
// without a relaunch.
func (a *App) SetPluginEnabled(id string, enabled bool) error {
	dir, err := a.pluginsDir()
	if err != nil {
		return err
	}
	recPath := filepath.Join(dir, id, "record.json")
	raw, err := os.ReadFile(recPath)
	if err != nil {
		return err
	}
	var rec PluginRecord
	if err := json.Unmarshal(raw, &rec); err != nil {
		return err
	}
	rec.Enabled = enabled
	out, _ := json.MarshalIndent(rec, "", "  ")
	return os.WriteFile(recPath, out, 0o644)
}

// UninstallPlugin removes the plugin directory entirely. The host
// dispatches a JEditor:plugin-uninstalled event so the running plugin
// can clean up any decorations / commands it registered.
func (a *App) UninstallPlugin(id string) error {
	dir, err := a.pluginsDir()
	if err != nil {
		return err
	}
	return os.RemoveAll(filepath.Join(dir, id))
}

// fetchURL downloads a URL with a short timeout. Refuses anything
// over 2 MB so a malicious manifest can't blow up the binary's
// memory on install.
func fetchURL(url string) ([]byte, error) {
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return nil, fmt.Errorf("url must use http(s)")
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("http %d", resp.StatusCode)
	}
	return io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
}

// extractEmbeddedManifest looks for an inline manifest comment at the
// top of the JS file shaped like:
//
//   //#jeditor-manifest {"id":"…","name":"…","version":"…"}
//
// Picks the FIRST matching line so authors can keep notes after it.
func extractEmbeddedManifest(src string) PluginManifest {
	var m PluginManifest
	for _, line := range strings.SplitN(src, "\n", 30) {
		line = strings.TrimSpace(line)
		const prefix = "//#jeditor-manifest"
		if !strings.HasPrefix(line, prefix) {
			continue
		}
		jsonPart := strings.TrimSpace(line[len(prefix):])
		_ = json.Unmarshal([]byte(jsonPart), &m)
		return m
	}
	return m
}
