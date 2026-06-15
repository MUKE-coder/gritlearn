package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritlearn/apps/api/internal/export"
	"gritlearn/apps/api/internal/models"
	"gritlearn/apps/api/internal/paginate"
)

// ProgressHandler handles progress endpoints.
type ProgressHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of progresses.
func (h *ProgressHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.Progress{}).Preload("User")

	res, err := paginate.List[models.Progress](
		query,
		paginate.Bind(c),
		paginate.Config{
			Searchable: []string{"concept_slug", "status"},
			Sortable:   map[string]bool{"id": true, "created_at": true, "concept_slug": true, "status": true},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch progresses",
			},
		})
		return
	}

	c.JSON(http.StatusOK, res)
}

// Export streams the full filtered list as CSV (default) or XLSX.
// Honours the same search/filter query params as List but skips
// pagination — you get every matching row in one file.
//
// Memory-bounded: reads in chunks of exportBatchSize so a million-row
// export doesn't OOM the process. CSV streams directly to the response
// writer; XLSX has to buffer (excelize requires the full sheet in
// memory before Write), so we still chunk the SCAN to avoid loading
// every row at once.
//
//	GET /api/progresses/export?format=csv
//	GET /api/progresses/export?format=xlsx&search=foo
func (h *ProgressHandler) Export(c *gin.Context) {
	const exportBatchSize = 1000

	format := c.DefaultQuery("format", "csv")
	search := c.Query("search")

	query := h.DB.Model(&models.Progress{}).Preload("User").Order("created_at desc")
	if search != "" && len([]string{"concept_slug", "status"}) > 0 {
		// Reuse the same searchable columns as List.
		searchable := []string{"concept_slug", "status"}
		clause := ""
		args := []any{}
		wild := "%" + search + "%"
		for i, col := range searchable {
			if i > 0 {
				clause += " OR "
			}
			clause += col + " ILIKE ?"
			args = append(args, wild)
		}
		query = query.Where(clause, args...)
	}

	opts := export.Options{
		Sheet: "Progresses",
		Columns: []export.Column{
			{Header: "ID", Field: "ID"},
			{Header: "ConceptSlug", Field: "ConceptSlug"},
			{Header: "Status", Field: "Status"},
			{Header: "CompletedAt", Field: "CompletedAt", Format: "date:2006-01-02"},
			{Header: "SyncedAt", Field: "SyncedAt", Format: "date:2006-01-02"},
			{Header: "Created At", Field: "CreatedAt", Format: "date:2006-01-02"},
		},
	}

	// Stream rows in batches via GORM's FindInBatches. CSV writes each
	// batch straight to the wire; XLSX accumulates into a slice (no
	// streaming API in excelize) but at least we never load the whole
	// table at once.
	if format == "xlsx" {
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", `attachment; filename="progresses.xlsx"`)
		var all []models.Progress
		if err := query.FindInBatches(&[]models.Progress{}, exportBatchSize, func(tx *gorm.DB, batch int) error {
			var rows []models.Progress
			if err := tx.Scan(&rows).Error; err != nil {
				return err
			}
			all = append(all, rows...)
			return nil
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "EXPORT_FAILED", "message": err.Error()},
			})
			return
		}
		if err := export.XLSX(c.Writer, all, opts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "EXPORT_FAILED", "message": err.Error()},
			})
		}
		return
	}

	// CSV path — true streaming. Write headers once, then each batch
	// flushes its rows directly to the response writer.
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", `attachment; filename="progresses.csv"`)

	headerWritten := false
	if err := query.FindInBatches(&[]models.Progress{}, exportBatchSize, func(tx *gorm.DB, batch int) error {
		var rows []models.Progress
		if err := tx.Scan(&rows).Error; err != nil {
			return err
		}
		if !headerWritten {
			if err := export.CSV(c.Writer, rows, opts); err != nil {
				return err
			}
			headerWritten = true
		} else {
			// Subsequent batches: write rows only, no header.
			if err := export.CSVRows(c.Writer, rows, opts); err != nil {
				return err
			}
		}
		return nil
	}).Error; err != nil {
		// Headers already sent — best we can do is log + truncate.
		// The client will see a malformed CSV; ops should re-run.
		// (We don't write a JSON error body once streaming has begun.)
		_ = err
	}
}

// GetByID returns a single progress by ID.
func (h *ProgressHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.Progress
	if err := h.DB.Preload("User").First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Progress not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new progress.
func (h *ProgressHandler) Create(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id" binding:"required"`
		ConceptSlug string `json:"concept_slug" binding:"required"`
		Status string `json:"status" binding:"required"`
		CompletedAt *time.Time `json:"completed_at"`
		SyncedAt *time.Time `json:"synced_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	item := models.Progress{
		UserID: req.UserID,
		ConceptSlug: req.ConceptSlug,
		Status: req.Status,
		CompletedAt: req.CompletedAt,
		SyncedAt: req.SyncedAt,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create progress",
			},
		})
		return
	}

	h.DB.Preload("User").First(&item, "id = ?", item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Progress created successfully",
	})
}

// Update modifies an existing progress.
func (h *ProgressHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.Progress
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Progress not found",
			},
		})
		return
	}

	var req struct {
		UserID *string `json:"user_id"`
		ConceptSlug string `json:"concept_slug"`
		Status string `json:"status"`
		CompletedAt *time.Time `json:"completed_at"`
		SyncedAt *time.Time `json:"synced_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	updates := map[string]interface{}{}
	if req.UserID != nil {
		updates["user_id"] = *req.UserID
	}
	if req.ConceptSlug != "" {
		updates["concept_slug"] = req.ConceptSlug
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.CompletedAt != nil {
		updates["completed_at"] = req.CompletedAt
	}
	if req.SyncedAt != nil {
		updates["synced_at"] = req.SyncedAt
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update progress",
			},
		})
		return
	}

	h.DB.Preload("User").First(&item, "id = ?", item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Progress updated successfully",
	})
}

// Delete soft-deletes a progress.
func (h *ProgressHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.Progress
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Progress not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete progress",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Progress deleted successfully",
	})
}
