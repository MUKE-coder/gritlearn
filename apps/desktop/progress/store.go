// Package progress owns the local-first progress mirror. It is the
// single source of truth for "what has this student done?" while
// offline. When the network comes back, B8's sync layer pushes every
// row with Dirty=true up to the server's Progress table and clears the
// flag.
//
// We deliberately keep this package small and standalone — the scaffold
// ships a generic outbox sync engine under apps/desktop/sync/, but its
// map[string]interface{} signatures don't reflect through Wails bindings
// cleanly. Progress only has one table and a fixed schema, so a focused
// package costs less than fighting the generic engine.
package progress

import (
	"errors"
	"fmt"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// LocalProgress is one row per concept the student has touched. We use
// ConceptSlug as the natural primary key because concept slugs are
// already unique and stable across content updates (B8 only changes
// MDX, not slugs).
type LocalProgress struct {
	ConceptSlug string     `gorm:"primaryKey;size:255" json:"concept_slug"`
	Status      string     `gorm:"size:32;not null" json:"status"`
	CompletedAt *time.Time `json:"completed_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	// SyncedAt and Dirty are written by B8's sync; for B6 they're set
	// on every local change so the engine can later pick up the row.
	SyncedAt *time.Time `json:"synced_at"`
	Dirty    bool       `gorm:"index;not null;default:true" json:"dirty"`
}

// Status values. We keep them as string constants instead of a Go
// enum so the JSON wire format is human-readable and adding a new
// status (e.g. "skipped" later) doesn't require a schema migration.
const (
	StatusStarted   = "started"   // viewed the concept but didn't do anything else
	StatusInProgress = "in_progress" // opened an example or worked on the exercise
	StatusCompleted = "completed" // student explicitly marked it complete
)

// Store wraps the SQLite handle and exposes the small set of
// progress-mutating methods the desktop UI actually needs.
type Store struct {
	DB *gorm.DB
}

// Open initializes a Store backed by the SQLite file at dbPath. The
// caller is responsible for creating the parent directory (App.startup
// does that next to the keychain init).
func Open(dbPath string) (*Store, error) {
	// glebarez/sqlite is the pure-Go driver — no CGO. That matters
	// because the desktop binary cross-compiles to multiple platforms
	// without a C toolchain.
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open progress db %s: %w", dbPath, err)
	}
	if err := db.AutoMigrate(&LocalProgress{}); err != nil {
		return nil, fmt.Errorf("migrate progress: %w", err)
	}
	return &Store{DB: db}, nil
}

// SetStatus is the workhorse — it upserts one progress row and ranks
// statuses so a later "viewed" doesn't downgrade an earlier "completed".
// Returns the resulting row so the frontend can update without re-fetching.
func (s *Store) SetStatus(slug, status string) (*LocalProgress, error) {
	if slug == "" {
		return nil, errors.New("slug required")
	}
	if !validStatus(status) {
		return nil, fmt.Errorf("invalid status %q", status)
	}

	var row LocalProgress
	err := s.DB.Where("concept_slug = ?", slug).First(&row).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("lookup progress: %w", err)
	}
	now := time.Now()
	isNew := errors.Is(err, gorm.ErrRecordNotFound)
	if isNew {
		row = LocalProgress{ConceptSlug: slug, Status: status, UpdatedAt: now, Dirty: true}
	} else {
		// Rank order: completed > in_progress > started. Lower-ranked
		// updates leave the higher status alone — you don't "undo" a
		// completion by re-opening the concept later.
		if rank(status) <= rank(row.Status) {
			return &row, nil
		}
		row.Status = status
		row.UpdatedAt = now
		row.Dirty = true
	}
	if status == StatusCompleted {
		row.CompletedAt = &now
	}

	if isNew {
		if err := s.DB.Create(&row).Error; err != nil {
			return nil, fmt.Errorf("create progress: %w", err)
		}
	} else {
		if err := s.DB.Save(&row).Error; err != nil {
			return nil, fmt.Errorf("save progress: %w", err)
		}
	}
	return &row, nil
}

// MarkUncompleted reverts a "completed" concept back to "in_progress"
// so students who tap the button by accident can recover without
// editing the SQLite file by hand. Lower statuses are left alone.
func (s *Store) MarkUncompleted(slug string) (*LocalProgress, error) {
	var row LocalProgress
	if err := s.DB.Where("concept_slug = ?", slug).First(&row).Error; err != nil {
		return nil, fmt.Errorf("lookup progress: %w", err)
	}
	if row.Status != StatusCompleted {
		return &row, nil
	}
	row.Status = StatusInProgress
	row.CompletedAt = nil
	row.UpdatedAt = time.Now()
	row.Dirty = true
	if err := s.DB.Save(&row).Error; err != nil {
		return nil, fmt.Errorf("save progress: %w", err)
	}
	return &row, nil
}

// All returns every row, oldest UpdatedAt first. The frontend reads
// this once at boot to color the sidebar dots; subsequent updates are
// applied optimistically by the React store.
func (s *Store) All() ([]LocalProgress, error) {
	var rows []LocalProgress
	if err := s.DB.Order("updated_at asc").Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("list progress: %w", err)
	}
	return rows, nil
}

// Clear deletes every row. Only used by the "Reset progress" command
// in the palette — useful for testing the B6 verify multiple times.
func (s *Store) Clear() error {
	return s.DB.Where("1 = 1").Delete(&LocalProgress{}).Error
}

func validStatus(s string) bool {
	switch s {
	case StatusStarted, StatusInProgress, StatusCompleted:
		return true
	}
	return false
}

func rank(s string) int {
	switch s {
	case StatusCompleted:
		return 3
	case StatusInProgress:
		return 2
	case StatusStarted:
		return 1
	}
	return 0
}
