package models

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Role constants
const (
	RoleAdmin   = "ADMIN"
	RoleEditor  = "EDITOR"
	RoleUser    = "USER"
	RoleStudent = "STUDENT"
	// grit:roles
)

// User represents a user in the system.
type User struct {
	ID              string         `gorm:"primarykey;size:36" json:"id"`
	FirstName       string         `gorm:"size:255;not null" json:"first_name" binding:"required"`
	LastName        string         `gorm:"size:255;not null" json:"last_name" binding:"required"`
	Email           string         `gorm:"size:255;uniqueIndex;not null" json:"email" binding:"required,email"`
	Password        string         `gorm:"size:255" json:"-"`
	Role            string         `gorm:"size:20;default:STUDENT" json:"role"`
	Avatar          string         `gorm:"size:500" json:"avatar"`
	JobTitle        string         `gorm:"size:255" json:"job_title"`
	Bio             string         `gorm:"type:text" json:"bio"`
	Active          bool           `gorm:"default:true" json:"active"`
	Provider        string         `gorm:"size:50;default:'local'" json:"provider"`
	GoogleID        string         `gorm:"size:255" json:"-"`
	GithubID        string         `gorm:"size:255" json:"-"`
	EmailVerifiedAt *time.Time     `json:"email_verified_at"`
	// 6-digit OTP delivered via Resend at signup. Rotated by Register
	// and Resend-OTP; cleared on successful verification. OTPExpiresAt
	// caps the window the code is valid for (10 minutes).
	OTPCode      string     `gorm:"size:6" json:"-"`
	OTPExpiresAt *time.Time `json:"-"`
	// Separate 6-digit code + expiry for password reset. Kept apart from
	// the verification OTP above so a pending forgot-password request
	// doesn't clobber (or get clobbered by) a re-verification attempt.
	PasswordResetCode      string     `gorm:"size:6" json:"-"`
	PasswordResetExpiresAt *time.Time `json:"-"`
	IPAddress       string         `gorm:"size:45" json:"ip_address"`
	MACAddress      string         `gorm:"size:50" json:"mac_address"`
	Version         int            `gorm:"not null;default:1" json:"version"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate generates a UUID and hashes the password before saving.
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	if u.Version == 0 {
		u.Version = 1
	}
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate increments Version so offline clients can detect that
// a record they edited has moved on. Pair with the Idempotency-Key
// middleware + /api/sync/push for safe write replay.
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	u.Version++
	return nil
}

// BeforeCreate generates a UUID for uploads.
func (u *Upload) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// CheckPassword compares the given password with the stored hash.
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// Models returns the ordered list of all models for migration.
// Models with no foreign key dependencies come first.
func Models() []interface{} {
	return []interface{}{
		&User{},
		&Upload{},
		&Blog{},
		&UIComponent{},
		&TwoFactorConfig{},
		&TrustedDevice{},
		&TOTPPendingToken{},
		&ActivityLog{},
		&WebhookEvent{},
		&FeatureFlag{},
		&FlagExposure{},
		&Notification{},
		&Progress{},
		&ContentManifest{},
		// grit:models
	}
}

// Migrate runs AutoMigrate for every registered model. For tables that
// already exist, GORM ALTERs them to add missing columns — we snapshot
// the column set before and after so the deploy log surfaces exactly
// what changed. Silent migrations are gone: if a column you expected
// didn't land, the diff makes it obvious.
//
//	================================================================
//	DATABASE MIGRATION — 8 model(s) registered
//	================================================================
//	  + created models.Building
//	  ~ models.User — added 2 column(s): is_vip, vip_notes
//	----------------------------------------------------------------
//	Migration done — 1 table(s) created, 1 altered (+2 column(s)), 6 unchanged.
//	================================================================
func Migrate(db *gorm.DB) error {
	models := Models()
	separator := strings.Repeat("=", 64)
	thinSep := strings.Repeat("-", 64)

	log.Println(separator)
	log.Printf("DATABASE MIGRATION — %d model(s) registered", len(models))
	log.Println(separator)

	// Silent logger keeps the schema-inspection SQL noise out of the diff log.
	silentDB := db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	mig := silentDB.Migrator()

	created := 0
	altered := 0
	columnsAdded := 0
	unchanged := 0

	for _, model := range models {
		existed := mig.HasTable(model)

		var before map[string]bool
		if existed {
			before = make(map[string]bool)
			cols, err := mig.ColumnTypes(model)
			if err == nil {
				for _, c := range cols {
					before[c.Name()] = true
				}
			}
		}

		if err := silentDB.AutoMigrate(model); err != nil {
			return fmt.Errorf("migrating %T: %w", model, err)
		}

		if !existed {
			log.Printf("  + created %T", model)
			created++
			continue
		}

		// Diff columns to surface anything AutoMigrate added.
		after, err := mig.ColumnTypes(model)
		if err != nil {
			unchanged++
			continue
		}
		var added []string
		for _, c := range after {
			if !before[c.Name()] {
				added = append(added, c.Name())
			}
		}
		if len(added) == 0 {
			unchanged++
			continue
		}
		log.Printf("  ~ %T — added %d column(s): %s", model, len(added), strings.Join(added, ", "))
		altered++
		columnsAdded += len(added)
	}

	log.Println(thinSep)
	log.Printf("Migration done — %d table(s) created, %d altered (+%d column(s)), %d unchanged.",
		created, altered, columnsAdded, unchanged)
	log.Println(separator)
	return nil
}
