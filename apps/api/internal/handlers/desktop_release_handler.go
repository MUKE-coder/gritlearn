package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// DesktopReleaseHandler serves the JEditor desktop release metadata the
// marketing /download page and the desktop app's auto-update check both
// read from. Resolution order (first hit wins, falls through on error):
//
//  1. DESKTOP_LATEST_* env vars — emergency manual override. Set these
//     when GitHub is down or you need to roll a hotfix that hasn't been
//     published yet.
//  2. GitHub Releases API — the normal path. The handler hits
//     https://api.github.com/repos/{owner}/{repo}/releases/latest,
//     matches each platform's asset by name pattern (see osMatchers),
//     and returns per-OS download URLs that proxy through this API.
//     Response cached in-process for 10 minutes.
//  3. Hard-coded defaults — last-resort fallback so the endpoint never
//     returns 500, even with no internet from the API host.
//
// Shipping a new desktop release is "build assets + gh release create".
// The API does NOT need to be redeployed; the next /api/desktop/latest
// call (or the next 10-minute cache miss) automatically picks up the
// new version from GitHub.
type DesktopReleaseHandler struct {
	mu     sync.Mutex
	cached *cachedDesktopRelease
}

type cachedDesktopRelease struct {
	payload   gin.H
	expiresAt time.Time
}

func NewDesktopReleaseHandler() *DesktopReleaseHandler {
	return &DesktopReleaseHandler{}
}

const (
	desktopDefaultGithubOwner  = "MUKE-coder"
	desktopDefaultGithubRepo   = "gritlearn"
	desktopDefaultVersion      = "0.1.0"
	desktopDefaultReleasedAt   = "2026-06-15T12:00:00Z"
	desktopDefaultReleaseNotes = "JEditor desktop preview — Wails + Monaco with Phase 1 curriculum bundled offline."

	desktopGithubCacheTTL  = 10 * time.Minute
	desktopGithubTimeoutMs = 8 * time.Second
)

// osTarget describes one downloadable build target the marketing page
// surfaces. The Name is what we return to the client; the AssetMatchers
// are the lowercase substrings we look for in each GitHub asset's name
// in priority order. First match wins.
type osTarget struct {
	Platform      string
	Label         string
	Detail        string
	DefaultFile   string
	AssetMatchers []string
}

// osTargets is the OS matrix the marketing site renders. The matchers
// expect asset names like "jeditor-windows-amd64.exe",
// "jeditor-darwin-arm64.dmg", etc. — see RELEASING.md for the
// canonical naming. Substrings only (not regexes) so a tag rename
// doesn't break the picker.
var osTargets = []osTarget{
	{
		Platform:    "windows",
		Label:       "Windows",
		Detail:      "Windows 10 / 11, 64-bit. NSIS installer.",
		DefaultFile: "jeditor-windows-amd64.exe",
		AssetMatchers: []string{
			"windows-amd64", "win-amd64", "win-x64", "windows-x64",
		},
	},
	{
		Platform:    "macos-arm",
		Label:       "macOS (Apple Silicon)",
		Detail:      "M1, M2, M3 — universal native binary.",
		DefaultFile: "jeditor-darwin-arm64.dmg",
		AssetMatchers: []string{
			"darwin-arm64", "macos-arm64", "mac-arm64", "apple-silicon",
		},
	},
	{
		Platform:    "macos-intel",
		Label:       "macOS (Intel)",
		Detail:      "x86_64 Macs running macOS 11+.",
		DefaultFile: "jeditor-darwin-amd64.dmg",
		AssetMatchers: []string{
			"darwin-amd64", "darwin-x64", "macos-amd64", "macos-x64", "mac-intel",
		},
	},
	{
		Platform:    "linux",
		Label:       "Linux",
		Detail:      "AppImage — runs on most distros without install.",
		DefaultFile: "jeditor-linux-amd64.AppImage",
		AssetMatchers: []string{
			"linux-amd64", "linux-x64", "appimage",
		},
	},
}

func desktopEnvOr(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

// desktopGithubRelease mirrors the bits we care about from
// /repos/{owner}/{repo}/releases/latest. The rest is discarded.
type desktopGithubRelease struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	PublishedAt string `json:"published_at"`
	HTMLURL     string `json:"html_url"`
	Draft       bool   `json:"draft"`
	Prerelease  bool   `json:"prerelease"`
	Assets      []struct {
		ID                 int64  `json:"id"`
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
		Size               int64  `json:"size"`
	} `json:"assets"`
}

func desktopFetchGithubLatest(owner, repo string) (*desktopGithubRelease, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	return desktopFetchGithub(url)
}

func desktopFetchGithubByTag(owner, repo, tag string) (*desktopGithubRelease, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/tags/%s", owner, repo, tag)
	return desktopFetchGithub(url)
}

func desktopFetchGithub(url string) (*desktopGithubRelease, error) {
	client := &http.Client{Timeout: desktopGithubTimeoutMs}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	if tok := strings.TrimSpace(os.Getenv("GITHUB_TOKEN")); tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("github %d: %s", resp.StatusCode, string(body))
	}
	var rel desktopGithubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return nil, err
	}
	if rel.Draft || rel.Prerelease {
		return nil, fmt.Errorf("latest release is draft/prerelease")
	}
	return &rel, nil
}

// pickAssetFor returns the first asset whose name contains any of the
// target's matchers (case-insensitive) AND is NOT an NSIS installer.
// The "no Setup keyword" rule prevents the windows-amd64 matcher from
// returning JEditor-Setup-vX.Y.Z.exe instead of the portable raw .exe
// — the auto-updater needs the raw binary to do its swap-and-relaunch
// dance; an installer would relaunch the wizard instead of the app.
// Returns (0, "", "", 0) if no asset matches.
func pickAssetFor(rel *desktopGithubRelease, t osTarget) (id int64, name, url string, size int64) {
	for _, matcher := range t.AssetMatchers {
		for _, a := range rel.Assets {
			lower := strings.ToLower(a.Name)
			if !strings.Contains(lower, matcher) {
				continue
			}
			// Skip NSIS / .dmg installer-flavoured names — those go
			// through pickInstallerAsset for the installer_url field.
			if strings.Contains(lower, "setup") || strings.Contains(lower, "installer") {
				continue
			}
			return a.ID, a.Name, a.BrowserDownloadURL, a.Size
		}
	}
	return 0, "", "", 0
}

// pickInstallerAsset finds the NSIS installer asset (for Windows) so
// the marketing /download page and the browser fallback can offer the
// wizard rather than the raw portable binary. Looks for "setup" in the
// name and prefers the non-slim flavour.
func pickInstallerAsset(rel *desktopGithubRelease) (string, int64) {
	var slim string
	var slimSize int64
	for _, a := range rel.Assets {
		lower := strings.ToLower(a.Name)
		if !strings.Contains(lower, "setup") {
			continue
		}
		if strings.Contains(lower, "slim") {
			slim = a.BrowserDownloadURL
			slimSize = a.Size
			continue
		}
		// Non-slim full installer — prefer this when both exist.
		return a.BrowserDownloadURL, a.Size
	}
	return slim, slimSize
}

// desktopRequestBase returns "scheme://host" for the current request,
// honouring X-Forwarded-Proto when the API sits behind Traefik/Dokploy.
// DESKTOP_DOWNLOAD_BASE overrides everything for CDN-fronted setups.
func desktopRequestBase(c *gin.Context) string {
	if override := strings.TrimSpace(os.Getenv("DESKTOP_DOWNLOAD_BASE")); override != "" {
		return strings.TrimRight(override, "/")
	}
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if proto := c.Request.Header.Get("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}
	host := c.Request.Host
	if h := c.Request.Header.Get("X-Forwarded-Host"); h != "" {
		host = h
	}
	return scheme + "://" + host
}

func desktopResolveFromGithub(proxyBase string) gin.H {
	owner := desktopEnvOr("DESKTOP_GITHUB_OWNER", desktopDefaultGithubOwner)
	repo := desktopEnvOr("DESKTOP_GITHUB_REPO", desktopDefaultGithubRepo)

	rel, err := desktopFetchGithubLatest(owner, repo)
	if err != nil {
		return nil
	}
	version := strings.TrimPrefix(rel.TagName, "v")
	version = strings.TrimPrefix(version, "V")

	downloads := make([]gin.H, 0, len(osTargets))
	any := false
	// Track the windows raw .exe URL so we can also surface it as
	// download_url at the payload root for the desktop auto-updater
	// (which expects flat fields, not the downloads array).
	windowsRawURL := ""
	for _, t := range osTargets {
		assetID, assetName, _, size := pickAssetFor(rel, t)
		entry := gin.H{
			"platform": t.Platform,
			"label":    t.Label,
			"detail":   t.Detail,
		}
		if assetID == 0 {
			entry["available"] = false
			entry["asset_name"] = t.DefaultFile
			entry["url"] = ""
			entry["size"] = 0
		} else {
			any = true
			entry["available"] = true
			entry["asset_name"] = assetName
			proxied := fmt.Sprintf("%s/api/desktop/download?tag=%s&os=%s",
				proxyBase, rel.TagName, t.Platform)
			entry["url"] = proxied
			entry["size"] = size
			if t.Platform == "windows" {
				windowsRawURL = proxied
			}
		}
		downloads = append(downloads, entry)
	}

	// If no asset matched any OS the release isn't usable — fall back.
	if !any {
		return nil
	}

	// installer_url uses the GitHub browser_download_url directly
	// rather than the /api/desktop/download proxy because the
	// installer isn't OS-keyed in our matcher rules (it's a single
	// asset, not per-platform). The desktop in-app updater uses
	// download_url; the marketing download page + the modal's
	// browser-fallback path use installer_url.
	installerURL, _ := pickInstallerAsset(rel)

	return gin.H{
		"version":       version,
		"download_url":  windowsRawURL,
		"installer_url": installerURL,
		"released_at":   rel.PublishedAt,
		"release_notes": rel.Body,
		"github_url":    rel.HTMLURL,
		"downloads":     downloads,
		"source":        "github",
	}
}

func (h *DesktopReleaseHandler) getCached() gin.H {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.cached != nil && time.Now().Before(h.cached.expiresAt) {
		return h.cached.payload
	}
	return nil
}

func (h *DesktopReleaseHandler) setCache(payload gin.H) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.cached = &cachedDesktopRelease{
		payload:   payload,
		expiresAt: time.Now().Add(desktopGithubCacheTTL),
	}
}

// fallbackPayload returns the hard-coded "no release available yet"
// shape so the endpoint and the marketing page never break.
func fallbackPayload(proxyBase string) gin.H {
	downloads := make([]gin.H, 0, len(osTargets))
	for _, t := range osTargets {
		downloads = append(downloads, gin.H{
			"platform":   t.Platform,
			"label":      t.Label,
			"detail":     t.Detail,
			"available":  false,
			"asset_name": t.DefaultFile,
			"url":        "",
			"size":       0,
		})
	}
	return gin.H{
		"version":       desktopDefaultVersion,
		"download_url":  "",
		"installer_url": "",
		"released_at":   desktopDefaultReleasedAt,
		"release_notes": desktopDefaultReleaseNotes,
		"github_url":    fmt.Sprintf("https://github.com/%s/%s/releases", desktopDefaultGithubOwner, desktopDefaultGithubRepo),
		"downloads":     downloads,
		"source":        "fallback",
	}
}

// GetLatest returns the latest desktop release metadata.
//
//	GET /api/desktop/latest
//	GET /api/desktop/latest?refresh=1  (bust the cache)
func (h *DesktopReleaseHandler) GetLatest(c *gin.Context) {
	// Env override wins — emergency manual control without a redeploy.
	if v := strings.TrimSpace(os.Getenv("DESKTOP_LATEST_VERSION")); v != "" {
		c.JSON(http.StatusOK, gin.H{
			"data": gin.H{
				"version":       v,
				"released_at":   desktopEnvOr("DESKTOP_LATEST_RELEASED_AT", desktopDefaultReleasedAt),
				"release_notes": desktopEnvOr("DESKTOP_LATEST_RELEASE_NOTES", desktopDefaultReleaseNotes),
				"github_url":    desktopEnvOr("DESKTOP_LATEST_URL", fmt.Sprintf("https://github.com/%s/%s/releases", desktopDefaultGithubOwner, desktopDefaultGithubRepo)),
				"downloads":     fallbackPayload(desktopRequestBase(c))["downloads"],
				"source":        "env",
			},
		})
		return
	}

	if c.Query("refresh") != "1" {
		if cached := h.getCached(); cached != nil {
			c.JSON(http.StatusOK, gin.H{"data": cached})
			return
		}
	}

	if payload := desktopResolveFromGithub(desktopRequestBase(c)); payload != nil {
		h.setCache(payload)
		c.JSON(http.StatusOK, gin.H{"data": payload})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": fallbackPayload(desktopRequestBase(c))})
}

// resolveDesktopPresigned hits the GitHub asset-download endpoint with
// Accept: application/octet-stream. GitHub responds with a 302 to a
// short-lived presigned URL — we read the Location and re-emit the
// redirect so private-repo assets work without GitHub auth on the
// client. Same trick as the Staylly desktop pipeline.
func resolveDesktopPresigned(owner, repo string, assetID int64) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/assets/%d", owner, repo, assetID)
	client := &http.Client{
		Timeout: desktopGithubTimeoutMs,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/octet-stream")
	if tok := strings.TrimSpace(os.Getenv("GITHUB_TOKEN")); tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusFound && resp.StatusCode != http.StatusTemporaryRedirect {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("github asset %d returned %d: %s", assetID, resp.StatusCode, string(body))
	}
	loc := resp.Header.Get("Location")
	if loc == "" {
		return "", fmt.Errorf("github asset %d redirect missing Location header", assetID)
	}
	return loc, nil
}

// GetDownload resolves a release asset for one OS and 302-redirects the
// client to a presigned GitHub CDN URL.
//
//	GET /api/desktop/download?os=windows
//	GET /api/desktop/download?os=macos-arm&tag=v1.0.0
func (h *DesktopReleaseHandler) GetDownload(c *gin.Context) {
	owner := desktopEnvOr("DESKTOP_GITHUB_OWNER", desktopDefaultGithubOwner)
	repo := desktopEnvOr("DESKTOP_GITHUB_REPO", desktopDefaultGithubRepo)

	wantOS := strings.ToLower(strings.TrimSpace(c.Query("os")))
	if wantOS == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "OS_REQUIRED", "message": "?os= is required (windows | macos-arm | macos-intel | linux)"}})
		return
	}
	var target *osTarget
	for i := range osTargets {
		if osTargets[i].Platform == wantOS {
			target = &osTargets[i]
			break
		}
	}
	if target == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "UNKNOWN_OS", "message": "unknown os value"}})
		return
	}

	tag := strings.TrimSpace(c.Query("tag"))
	var rel *desktopGithubRelease
	var err error
	if tag == "" {
		rel, err = desktopFetchGithubLatest(owner, repo)
	} else {
		rel, err = desktopFetchGithubByTag(owner, repo, tag)
	}
	if err != nil {
		if u := strings.TrimSpace(os.Getenv("DESKTOP_LATEST_URL")); u != "" {
			c.Redirect(http.StatusFound, u)
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"code": "GITHUB_UNREACHABLE", "message": err.Error()}})
		return
	}

	assetID, _, _, _ := pickAssetFor(rel, *target)
	if assetID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NO_ASSET", "message": "release has no asset for this OS yet"}})
		return
	}

	presigned, err := resolveDesktopPresigned(owner, repo, assetID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"code": "PRESIGN_FAILED", "message": err.Error()}})
		return
	}
	c.Redirect(http.StatusFound, presigned)
}

// GetDiagnostics confirms whether the running container can see the
// release-pipeline env vars and makes a live test call to GitHub.
// Never returns GITHUB_TOKEN — only its length + first 4 chars so a
// typo'd paste is detectable without leaking the secret.
//
//	GET /api/desktop/diagnostics
func (h *DesktopReleaseHandler) GetDiagnostics(c *gin.Context) {
	envCheck := func(name string) gin.H {
		v := os.Getenv(name)
		trimmed := strings.TrimSpace(v)
		prefix := ""
		if n := len(trimmed); n > 0 {
			pn := 4
			if n < pn {
				pn = n
			}
			prefix = trimmed[:pn] + "..."
		}
		return gin.H{
			"name":           name,
			"set":            v != "",
			"length":         len(v),
			"trimmed_length": len(trimmed),
			"has_whitespace": len(v) != len(trimmed),
			"prefix":         prefix,
		}
	}

	envs := []gin.H{
		envCheck("GITHUB_TOKEN"),
		envCheck("DESKTOP_GITHUB_OWNER"),
		envCheck("DESKTOP_GITHUB_REPO"),
		envCheck("DESKTOP_LATEST_VERSION"),
	}

	owner := desktopEnvOr("DESKTOP_GITHUB_OWNER", desktopDefaultGithubOwner)
	repo := desktopEnvOr("DESKTOP_GITHUB_REPO", desktopDefaultGithubRepo)

	githubTest := gin.H{"owner": owner, "repo": repo}
	rel, err := desktopFetchGithubLatest(owner, repo)
	if err != nil {
		githubTest["ok"] = false
		githubTest["error"] = err.Error()
	} else {
		githubTest["ok"] = true
		githubTest["latest_tag"] = rel.TagName
		githubTest["asset_count"] = len(rel.Assets)
		matched := map[string]string{}
		for _, t := range osTargets {
			_, name, _, _ := pickAssetFor(rel, t)
			matched[t.Platform] = name
		}
		githubTest["matched"] = matched
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"env":         envs,
			"github_test": githubTest,
			"server_time": time.Now().UTC().Format(time.RFC3339),
		},
	})
}
