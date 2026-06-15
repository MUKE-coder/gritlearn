// Desktop-sync endpoints owned by the desktop client. Two surfaces:
//
//	POST /api/progresses/sync         — student pushes one local progress row
//	                                    (offline-first). Upserts by
//	                                    (user_id, concept_slug); never duplicates.
//	GET  /api/content_manifests/latest — public read of the most recent
//	                                    published manifest version. Lets the
//	                                    desktop know whether its bundled
//	                                    curriculum is stale.
//
// We deliberately give progress its own endpoint instead of bending the
// scaffold's generic POST /api/progresses, so the upsert semantics don't
// leak into the admin-facing CRUD surface. The scaffold's generic
// handlers in sync.go (push/pull for the outbox engine) are unrelated —
// GritLearn doesn't use that engine.

package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"gritlearn/apps/api/internal/models"
)

// DesktopSyncHandler holds dependencies for the desktop-sync endpoints.
type DesktopSyncHandler struct {
	DB *gorm.DB
}

type pushProgressRequest struct {
	ConceptSlug string     `json:"concept_slug" binding:"required"`
	Status      string     `json:"status" binding:"required"`
	CompletedAt *time.Time `json:"completed_at"`
}

// PushProgress upserts one progress row for the authenticated user.
// Idempotent — retrying a sync after a network blip stays safe because
// the (user_id, concept_slug) unique index turns the second INSERT into
// an UPDATE. SyncedAt is stamped server-side so client clocks can't
// pollute the audit trail.
func (h *DesktopSyncHandler) PushProgress(c *gin.Context) {
	userID := c.GetString("user_id") // populated by middleware.Auth
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{"code": "UNAUTHENTICATED", "message": "missing user"},
		})
		return
	}

	var req pushProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	now := time.Now()
	row := models.Progress{
		UserID:      userID,
		ConceptSlug: req.ConceptSlug,
		Status:      req.Status,
		CompletedAt: req.CompletedAt,
		SyncedAt:    &now,
	}

	// ON CONFLICT (user_id, concept_slug) DO UPDATE — the upsert that
	// makes offline-first safe. We DON'T overwrite CompletedAt with NULL
	// when the client doesn't supply one; the server keeps whatever it had.
	updates := map[string]interface{}{
		"status":    req.Status,
		"synced_at": &now,
	}
	if req.CompletedAt != nil {
		updates["completed_at"] = req.CompletedAt
	}

	if err := h.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "concept_slug"}},
		DoUpdates: clause.Assignments(updates),
	}).Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "DB_ERROR", "message": err.Error()},
		})
		return
	}

	// Re-read into a FRESH struct so the response reflects the actual
	// persisted row. We can't re-use `row` because BeforeCreate already
	// stamped it with a new UUID — GORM would then add that UUID as an
	// extra WHERE predicate on First() and silently miss the row.
	var stored models.Progress
	h.DB.Where("user_id = ? AND concept_slug = ?", userID, req.ConceptSlug).First(&stored)

	c.JSON(http.StatusOK, gin.H{
		"data":    stored,
		"message": "Progress synced",
	})
}

// LatestContentManifest returns the most recent published manifest, or
// 204 No Content when nothing's been published yet. Public — the desktop
// hits it on launch before the user is even signed in.
func (h *DesktopSyncHandler) LatestContentManifest(c *gin.Context) {
	var row models.ContentManifest
	err := h.DB.Where("published = ?", true).
		Order("version desc, created_at desc").
		First(&row).Error
	if err != nil {
		// No published manifest yet — that's not an error, just nothing
		// to update to. The desktop treats this as "your local version
		// is fine, keep using it".
		c.Status(http.StatusNoContent)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":    row,
		"message": "Latest manifest",
	})
}
