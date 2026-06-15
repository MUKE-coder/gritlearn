package main

import (
	"fmt"

	"gritlearn/apps/desktop/progress"
)

// ProgressRow is the on-the-wire shape of one progress entry. We keep
// it flat with plain string/bool/string-encoded timestamps so Wails'
// binding generator reflects it cleanly (the same lesson we learned
// in B4: avoid time.Time / map[string]interface{} in the public surface).
type ProgressRow struct {
	ConceptSlug string `json:"concept_slug"`
	Status      string `json:"status"`
	CompletedAt string `json:"completed_at"` // RFC3339, "" when null
	UpdatedAt   string `json:"updated_at"`   // RFC3339
	Dirty       bool   `json:"dirty"`
}

func toRow(r *progress.LocalProgress) ProgressRow {
	out := ProgressRow{
		ConceptSlug: r.ConceptSlug,
		Status:      r.Status,
		UpdatedAt:   r.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		Dirty:       r.Dirty,
	}
	if r.CompletedAt != nil {
		out.CompletedAt = r.CompletedAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	return out
}

// GetLocalProgress returns every progress row. Called once on boot to
// hydrate the React progress provider.
func (a *App) GetLocalProgress() ([]ProgressRow, error) {
	if a.progress == nil {
		return []ProgressRow{}, nil
	}
	rows, err := a.progress.All()
	if err != nil {
		return nil, fmt.Errorf("read local progress: %w", err)
	}
	out := make([]ProgressRow, 0, len(rows))
	for i := range rows {
		out = append(out, toRow(&rows[i]))
	}
	return out, nil
}

// RecordConceptViewed is fired when a student selects a concept. It is
// idempotent — re-viewing a completed concept does NOT downgrade the
// row's status (see progress.SetStatus's rank check).
func (a *App) RecordConceptViewed(slug string) (ProgressRow, error) {
	return a.recordStatus(slug, progress.StatusStarted)
}

// RecordExampleOpened is fired when the student clicks "Open in editor"
// on an <ExampleProject>. It upgrades the row to "in_progress".
func (a *App) RecordExampleOpened(slug, exampleID string) (ProgressRow, error) {
	// exampleID is unused for now — recorded only at the concept level.
	// Captured here so callers can pass it without us breaking later
	// when we split per-example progress (B12 polish).
	_ = exampleID
	return a.recordStatus(slug, progress.StatusInProgress)
}

// MarkConceptCompleted is the explicit "I'm done with this" toggle —
// triggered by the Mark Complete button in the lesson header.
func (a *App) MarkConceptCompleted(slug string) (ProgressRow, error) {
	return a.recordStatus(slug, progress.StatusCompleted)
}

// MarkConceptUncompleted reverts a completion. Lower statuses
// (started / in_progress) are unaffected.
func (a *App) MarkConceptUncompleted(slug string) (ProgressRow, error) {
	if a.progress == nil {
		return ProgressRow{}, fmt.Errorf("progress store not initialized")
	}
	row, err := a.progress.MarkUncompleted(slug)
	if err != nil {
		return ProgressRow{}, err
	}
	return toRow(row), nil
}

// ClearLocalProgress wipes the table. Bound for the "Reset progress"
// command in the palette, useful for re-running B6's offline verify.
func (a *App) ClearLocalProgress() error {
	if a.progress == nil {
		return fmt.Errorf("progress store not initialized")
	}
	return a.progress.Clear()
}

func (a *App) recordStatus(slug, status string) (ProgressRow, error) {
	if a.progress == nil {
		return ProgressRow{}, fmt.Errorf("progress store not initialized")
	}
	row, err := a.progress.SetStatus(slug, status)
	if err != nil {
		return ProgressRow{}, err
	}
	return toRow(row), nil
}
