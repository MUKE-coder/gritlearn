package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Desktop-sync bindings exposed to the React frontend. These are best-
// effort by design — every method assumes the network may be down and
// the offline experience must not be blocked by their failure. The
// frontend is expected to call them on launch (when online) and on
// demand via the Sync button.

// SyncProgressResult summarizes one round of pushing dirty progress
// rows. Counts and errors are surfaced to the UI so the student can see
// what just happened.
type SyncProgressResult struct {
	Pushed   int      `json:"pushed"`   // rows successfully synced
	Skipped  int      `json:"skipped"`  // rows that weren't dirty
	Failed   int      `json:"failed"`   // rows that errored
	Errors   []string `json:"errors"`   // human-readable error messages
	HadAuth  bool     `json:"had_auth"` // false ⇒ no token cached, nothing tried
}

// SyncProgress pushes every Dirty=true local progress row to the
// server via POST /api/progresses/sync. After a 2xx response we clear
// the dirty flag and stamp SyncedAt. Failures leave the dirty flag set
// so the next sync retries.
func (a *App) SyncProgress() (SyncProgressResult, error) {
	res := SyncProgressResult{Errors: []string{}}

	if a.progress == nil {
		return res, fmt.Errorf("progress store not initialized")
	}

	token, err := a.kc.Get("access_token")
	if err != nil || token == "" {
		// No cached token = student isn't signed in yet. We treat this
		// as "nothing to push" instead of an error so the autosync on
		// /auth/login doesn't spam errors on first launch.
		return res, nil
	}
	res.HadAuth = true

	rows, err := a.progress.All()
	if err != nil {
		return res, fmt.Errorf("list local progress: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	endpoint := a.apiURL + "/progresses/sync"

	for i := range rows {
		r := &rows[i]
		if !r.Dirty {
			res.Skipped++
			continue
		}
		body := map[string]interface{}{
			"concept_slug": r.ConceptSlug,
			"status":       r.Status,
		}
		if r.CompletedAt != nil {
			body["completed_at"] = r.CompletedAt.UTC().Format(time.RFC3339)
		}
		payload, mErr := json.Marshal(body)
		if mErr != nil {
			res.Failed++
			res.Errors = append(res.Errors, mErr.Error())
			continue
		}
		req, hErr := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(payload))
		if hErr != nil {
			res.Failed++
			res.Errors = append(res.Errors, hErr.Error())
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, doErr := client.Do(req)
		if doErr != nil {
			// Network error — almost certainly offline. Don't treat
			// this as a per-row failure; surface once and stop trying.
			res.Errors = append(res.Errors, "offline: "+doErr.Error())
			return res, nil
		}
		// Drain + close the body so the connection can be reused.
		_, _ = bytes.NewBuffer(nil).ReadFrom(resp.Body)
		_ = resp.Body.Close()

		if resp.StatusCode == http.StatusUnauthorized {
			res.Errors = append(res.Errors, "session expired")
			return res, nil
		}
		if resp.StatusCode >= 400 {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("HTTP %d", resp.StatusCode))
			continue
		}

		// Success — clear the dirty flag and stamp SyncedAt.
		now := time.Now()
		r.Dirty = false
		r.SyncedAt = &now
		if uErr := a.progress.DB.Save(r).Error; uErr != nil {
			res.Failed++
			res.Errors = append(res.Errors, uErr.Error())
			continue
		}
		res.Pushed++
	}

	return res, nil
}

// ContentUpdateInfo summarizes how the local bundle compares to the
// server's latest published manifest. The frontend renders the
// "update available" banner from this.
type ContentUpdateInfo struct {
	LocalVersion  int    `json:"local_version"`
	LatestVersion int    `json:"latest_version"`
	UpdateAvail   bool   `json:"update_available"`
	BundleURL     string `json:"bundle_url"`
	Notes         string `json:"notes"`
}

// CheckContentUpdate compares the embedded manifest's version to the
// server's latest published ContentManifest. Returns UpdateAvail=true
// when the server is newer. Network failure is silent — the desktop
// just keeps using its local bundle.
func (a *App) CheckContentUpdate() (ContentUpdateInfo, error) {
	info := ContentUpdateInfo{}

	// Read local version from the embedded manifest.
	rawLocal, err := a.GetManifest()
	if err == nil {
		var local struct {
			Version int `json:"version"`
		}
		if jErr := json.Unmarshal([]byte(rawLocal), &local); jErr == nil {
			info.LocalVersion = local.Version
		}
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(a.apiURL + "/content_manifests/latest")
	if err != nil {
		// Offline or API down — silently return current state. The
		// student keeps using the bundled curriculum.
		return info, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		// Server has no published manifest yet — nothing to do.
		return info, nil
	}
	if resp.StatusCode >= 400 {
		return info, nil
	}

	var envelope struct {
		Data struct {
			Version   int    `json:"version"`
			BundleURL string `json:"bundle_url"`
			Notes     string `json:"notes"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return info, nil
	}

	info.LatestVersion = envelope.Data.Version
	info.BundleURL = envelope.Data.BundleURL
	info.Notes = envelope.Data.Notes
	info.UpdateAvail = info.LatestVersion > info.LocalVersion
	return info, nil
}
