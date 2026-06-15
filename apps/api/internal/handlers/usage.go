// Admin usage handler — aggregates the GritLearn-specific metrics the
// admin dashboard renders. Kept narrow on purpose: one endpoint, one
// response shape, computed in a single DB round (where possible) so
// the admin landing page doesn't fire a request waterfall.

package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UsageHandler owns /api/admin/usage/*. Only mounted under the
// admin route group so the data never leaks to logged-in students.
type UsageHandler struct {
	DB *gorm.DB
}

// SummaryResponse is the dashboard's primary widget payload.
type SummaryResponse struct {
	TotalSignups          int64                `json:"total_signups"`
	SignupsLast7d         int64                `json:"signups_last_7d"`
	Active7d              int64                `json:"active_7d"`
	Active30d             int64                `json:"active_30d"`
	ConceptsCompleted     int64                `json:"concepts_completed"`
	MostCompletedConcepts []ConceptCompletion  `json:"most_completed_concepts"`
}

type ConceptCompletion struct {
	ConceptSlug string `json:"concept_slug"`
	Count       int64  `json:"count"`
}

// Summary returns the dashboard counts. Active = "has synced at least one
// progress row in the last N days", which is the closest proxy we have
// to "is using the desktop app". A student who pulled but never marked
// anything is invisible here — fine for v1, will revisit when Pulse is
// wired up to actually emit events from the desktop.
func (h *UsageHandler) Summary(c *gin.Context) {
	var res SummaryResponse

	// One scan over the users table for both signup counts.
	if err := h.DB.Raw(`
		SELECT
			COUNT(*) AS total_signups,
			COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS signups_last_7d
		FROM users
		WHERE deleted_at IS NULL
	`).Row().Scan(&res.TotalSignups, &res.SignupsLast7d); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "DB_ERROR", "message": err.Error()},
		})
		return
	}

	// Active = at least one synced progress row in window.
	if err := h.DB.Raw(`
		SELECT
			COUNT(DISTINCT user_id) FILTER (WHERE synced_at > NOW() - INTERVAL '7 days') AS active_7d,
			COUNT(DISTINCT user_id) FILTER (WHERE synced_at > NOW() - INTERVAL '30 days') AS active_30d,
			COUNT(*) FILTER (WHERE status = 'completed') AS concepts_completed
		FROM progresses
		WHERE deleted_at IS NULL
	`).Row().Scan(&res.Active7d, &res.Active30d, &res.ConceptsCompleted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "DB_ERROR", "message": err.Error()},
		})
		return
	}

	// Top 5 most-completed concepts. Pulse will probably do this
	// better once it tracks desktop events, but for now we read
	// straight from the source of truth.
	rows, err := h.DB.Raw(`
		SELECT concept_slug, COUNT(*) AS cnt
		FROM progresses
		WHERE deleted_at IS NULL AND status = 'completed'
		GROUP BY concept_slug
		ORDER BY cnt DESC
		LIMIT 5
	`).Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "DB_ERROR", "message": err.Error()},
		})
		return
	}
	defer rows.Close()

	res.MostCompletedConcepts = []ConceptCompletion{}
	for rows.Next() {
		var item ConceptCompletion
		if err := rows.Scan(&item.ConceptSlug, &item.Count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "DB_ERROR", "message": err.Error()},
			})
			return
		}
		res.MostCompletedConcepts = append(res.MostCompletedConcepts, item)
	}

	c.JSON(http.StatusOK, gin.H{"data": res, "message": "Usage summary"})
}
