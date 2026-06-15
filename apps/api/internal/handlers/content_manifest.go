package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritlearn/apps/api/internal/export"
	"gritlearn/apps/api/internal/models"
	"gritlearn/apps/api/internal/paginate"
)

// ContentManifestHandler handles contentmanifest endpoints.
type ContentManifestHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of content_manifests.
func (h *ContentManifestHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.ContentManifest{})

	res, err := paginate.List[models.ContentManifest](
		query,
		paginate.Bind(c),
		paginate.Config{
			Searchable: []string{"notes", "bundle_url"},
			Sortable:   map[string]bool{"id": true, "created_at": true, "version": true, "notes": true, "bundle_url": true},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch content_manifests",
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
//	GET /api/content_manifests/export?format=csv
//	GET /api/content_manifests/export?format=xlsx&search=foo
func (h *ContentManifestHandler) Export(c *gin.Context) {
	const exportBatchSize = 1000

	format := c.DefaultQuery("format", "csv")
	search := c.Query("search")

	query := h.DB.Model(&models.ContentManifest{}).Order("created_at desc")
	if search != "" && len([]string{"notes", "bundle_url"}) > 0 {
		// Reuse the same searchable columns as List.
		searchable := []string{"notes", "bundle_url"}
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
		Sheet: "ContentManifests",
		Columns: []export.Column{
			{Header: "ID", Field: "ID"},
			{Header: "Version", Field: "Version"},
			{Header: "Notes", Field: "Notes"},
			{Header: "BundleURL", Field: "BundleURL"},
			{Header: "Published", Field: "Published", Format: "bool"},
			{Header: "Created At", Field: "CreatedAt", Format: "date:2006-01-02"},
		},
	}

	// Stream rows in batches via GORM's FindInBatches. CSV writes each
	// batch straight to the wire; XLSX accumulates into a slice (no
	// streaming API in excelize) but at least we never load the whole
	// table at once.
	if format == "xlsx" {
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", `attachment; filename="content_manifests.xlsx"`)
		var all []models.ContentManifest
		if err := query.FindInBatches(&[]models.ContentManifest{}, exportBatchSize, func(tx *gorm.DB, batch int) error {
			var rows []models.ContentManifest
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
	c.Header("Content-Disposition", `attachment; filename="content_manifests.csv"`)

	headerWritten := false
	if err := query.FindInBatches(&[]models.ContentManifest{}, exportBatchSize, func(tx *gorm.DB, batch int) error {
		var rows []models.ContentManifest
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

// GetByID returns a single contentmanifest by ID.
func (h *ContentManifestHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.ContentManifest
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ContentManifest not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new contentmanifest.
func (h *ContentManifestHandler) Create(c *gin.Context) {
	var req struct {
		Version int `json:"version"`
		Notes string `json:"notes"`
		BundleURL string `json:"bundle_url" binding:"required"`
		Published bool `json:"published"`
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

	item := models.ContentManifest{
		Version: req.Version,
		Notes: req.Notes,
		BundleURL: req.BundleURL,
		Published: req.Published,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create contentmanifest",
			},
		})
		return
	}

	h.DB.First(&item, "id = ?", item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "ContentManifest created successfully",
	})
}

// Update modifies an existing contentmanifest.
func (h *ContentManifestHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.ContentManifest
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ContentManifest not found",
			},
		})
		return
	}

	var req struct {
		Version *int `json:"version"`
		Notes string `json:"notes"`
		BundleURL string `json:"bundle_url"`
		Published *bool `json:"published"`
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
	if req.Version != nil {
		updates["version"] = *req.Version
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.BundleURL != "" {
		updates["bundle_url"] = req.BundleURL
	}
	if req.Published != nil {
		updates["published"] = *req.Published
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update contentmanifest",
			},
		})
		return
	}

	h.DB.First(&item, "id = ?", item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "ContentManifest updated successfully",
	})
}

// Delete soft-deletes a contentmanifest.
func (h *ContentManifestHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.ContentManifest
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ContentManifest not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete contentmanifest",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ContentManifest deleted successfully",
	})
}
