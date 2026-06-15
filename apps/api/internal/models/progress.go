package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Progress represents one student's progress on one concept. The
// (user_id, concept_slug) tuple is unique so the desktop's offline-first
// push can use ON CONFLICT to upsert — no duplicate rows when a student
// completes the same lesson twice across syncs.
type Progress struct {
	ID          string         `gorm:"primarykey;size:36" json:"id"`
	UserID      string         `gorm:"size:36;uniqueIndex:idx_progress_user_concept" json:"user_id" binding:"required"`
	User        User           `gorm:"foreignKey:UserID" json:"user"`
	ConceptSlug string         `gorm:"size:255;uniqueIndex:idx_progress_user_concept" json:"concept_slug" binding:"required"`
	Status      string         `gorm:"size:32" json:"status" binding:"required"`
	CompletedAt *time.Time     `json:"completed_at"`
	SyncedAt    *time.Time     `json:"synced_at"`
	Version     int            `gorm:"not null;default:1" json:"version"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate generates a UUID before inserting.
func (m *Progress) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}

// BeforeUpdate increments Version so offline clients can detect server-side updates.
func (m *Progress) BeforeUpdate(tx *gorm.DB) error {
	m.Version++
	return nil
}
