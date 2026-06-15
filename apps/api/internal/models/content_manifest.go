package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ContentManifest represents one published version of the bundled
// curriculum. Admin bumps Version and points BundleURL at the new bundle;
// desktop clients compare their local manifest version to the latest
// Published row to decide whether to prompt for an update.
//
// Admin-only writes — no optimistic-lock row version (the domain Version
// field is the curriculum bundle's monotonically increasing release number,
// not a per-row lock).
type ContentManifest struct {
	ID        string         `gorm:"primarykey;size:36" json:"id"`
	Version   int            `gorm:"not null;index" json:"version" binding:"required"`
	Notes     string         `gorm:"type:text" json:"notes"`
	BundleURL string         `gorm:"size:500" json:"bundle_url" binding:"required"`
	Published bool           `gorm:"index" json:"published"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate generates a UUID before inserting.
func (m *ContentManifest) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}
