package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritlearn/apps/api/internal/models"
)

// UIRegistryHandler serves the shadcn-compatible component registry.
type UIRegistryHandler struct {
	DB     *gorm.DB
	APIURL string // e.g. "http://localhost:8080"
}

// NewUIRegistryHandler constructs the handler.
func NewUIRegistryHandler(db *gorm.DB, apiURL string) *UIRegistryHandler {
	return &UIRegistryHandler{DB: db, APIURL: apiURL}
}

// ── Public registry endpoints ────────────────────────────────────────────────

// GetRegistry serves GET /r.json — shadcn-compatible root registry.
func (h *UIRegistryHandler) GetRegistry(c *gin.Context) {
	var components []models.UIComponent
	if err := h.DB.Where("is_public = ?", true).
		Order("category, name").
		Find(&components).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch registry"})
		return
	}

	items := make([]gin.H, 0, len(components))
	for _, comp := range components {
		items = append(items, gin.H{
			"name":        comp.Name,
			"type":        "registry:block",
			"title":       comp.DisplayName,
			"description": comp.Description,
			"category":    comp.Category,
			"registryUrl": h.APIURL + "/r/" + comp.Name + ".json",
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"$schema":  "https://ui.shadcn.com/schema/registry.json",
		"name":     "grit-ui",
		"homepage": "https://gritframework.dev/components",
		"items":    items,
	})
}

// GetComponent serves GET /r/:name.json — full shadcn component JSON for npx shadcn add.
func (h *UIRegistryHandler) GetComponent(c *gin.Context) {
	name := c.Param("name")
	// Strip .json suffix if present
	if len(name) > 5 && name[len(name)-5:] == ".json" {
		name = name[:len(name)-5]
	}

	var comp models.UIComponent
	if err := h.DB.Where("name = ? AND is_public = ?", name, true).First(&comp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "component not found"})
		return
	}

	var files []gin.H
	_ = json.Unmarshal([]byte(comp.Files), &files)

	var dependencies []string
	_ = json.Unmarshal([]byte(comp.Dependencies), &dependencies)

	var registryDeps []string
	_ = json.Unmarshal([]byte(comp.RegistryDeps), &registryDeps)

	c.JSON(http.StatusOK, gin.H{
		"$schema":              "https://ui.shadcn.com/schema/registry-item.json",
		"name":                 comp.Name,
		"type":                 "registry:block",
		"title":                comp.DisplayName,
		"description":          comp.Description,
		"files":                files,
		"dependencies":         dependencies,
		"registryDependencies": registryDeps,
	})
}

// ── Authenticated list endpoints ──────────────────────────────────────────────

// ListComponents serves GET /api/ui-components.
func (h *UIRegistryHandler) ListComponents(c *gin.Context) {
	category := c.Query("category")

	type componentSummary struct {
		ID          uint   `json:"id"`
		Name        string `json:"name"`
		DisplayName string `json:"display_name"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Tags        string `json:"tags"`
		PreviewCode string `json:"preview_code"`
	}

	query := h.DB.Model(&models.UIComponent{}).Where("is_public = ?", true)
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var components []componentSummary
	if err := query.Order("category, name").Find(&components).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch components"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": components})
}

// GetComponentDetail serves GET /api/ui-components/:name.
func (h *UIRegistryHandler) GetComponentDetail(c *gin.Context) {
	name := c.Param("name")

	var comp models.UIComponent
	if err := h.DB.Where("name = ? AND is_public = ?", name, true).First(&comp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "component not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comp})
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

type uiComponentInput struct {
	Name         string `json:"name" binding:"required"`
	DisplayName  string `json:"display_name" binding:"required"`
	Description  string `json:"description"`
	Category     string `json:"category" binding:"required"`
	Tags         string `json:"tags"`
	Files        string `json:"files" binding:"required"`
	Dependencies string `json:"dependencies"`
	RegistryDeps string `json:"registry_deps"`
	PreviewCode  string `json:"preview_code"`
	IsPublic     *bool  `json:"is_public"`
}

// CreateComponent serves POST /api/admin/ui-components.
func (h *UIRegistryHandler) CreateComponent(c *gin.Context) {
	var req uiComponentInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	comp := models.UIComponent{
		Name:         req.Name,
		DisplayName:  req.DisplayName,
		Description:  req.Description,
		Category:     req.Category,
		Tags:         req.Tags,
		Files:        req.Files,
		Dependencies: req.Dependencies,
		RegistryDeps: req.RegistryDeps,
		PreviewCode:  req.PreviewCode,
		IsPublic:     isPublic,
	}

	if err := h.DB.Create(&comp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create component"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": comp, "message": "Component created"})
}

// UpdateComponent serves PUT /api/admin/ui-components/:name.
func (h *UIRegistryHandler) UpdateComponent(c *gin.Context) {
	name := c.Param("name")

	var comp models.UIComponent
	if err := h.DB.Where("name = ?", name).First(&comp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "component not found"})
		return
	}

	var req uiComponentInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"display_name":  req.DisplayName,
		"description":   req.Description,
		"category":      req.Category,
		"tags":          req.Tags,
		"files":         req.Files,
		"dependencies":  req.Dependencies,
		"registry_deps": req.RegistryDeps,
		"preview_code":  req.PreviewCode,
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}

	if err := h.DB.Model(&comp).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update component"})
		return
	}

	h.DB.Where("name = ?", name).First(&comp)
	c.JSON(http.StatusOK, gin.H{"data": comp, "message": "Component updated"})
}

// DeleteComponent serves DELETE /api/admin/ui-components/:name.
func (h *UIRegistryHandler) DeleteComponent(c *gin.Context) {
	name := c.Param("name")

	var comp models.UIComponent
	if err := h.DB.Where("name = ?", name).First(&comp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "component not found"})
		return
	}

	if err := h.DB.Delete(&comp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete component"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Component deleted"})
}
