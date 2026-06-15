package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"gritlearn/apps/api/internal/models"
)

// ContentManifestService handles business logic for content_manifests.
type ContentManifestService struct {
	DB *gorm.DB
}

// ContentManifestListParams holds pagination and filter parameters.
type ContentManifestListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of content_manifests.
func (s *ContentManifestService) List(params ContentManifestListParams) ([]models.ContentManifest, int64, int, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	if params.SortOrder != "asc" && params.SortOrder != "desc" {
		params.SortOrder = "desc"
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}

	query := s.DB.Model(&models.ContentManifest{})

	if params.Search != "" {
		query = query.Where("notes ILIKE ? OR bundle_url ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.ContentManifest
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching content_manifests: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single contentmanifest by ID.
func (s *ContentManifestService) GetByID(id string) (*models.ContentManifest, error) {
	var item models.ContentManifest
	if err := s.DB.First(&item, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("contentmanifest not found: %w", err)
	}
	return &item, nil
}

// Create creates a new contentmanifest.
func (s *ContentManifestService) Create(item *models.ContentManifest) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating contentmanifest: %w", err)
	}
	return nil
}

// Update modifies an existing contentmanifest. Two queries: First() loads
// the row + verifies existence; Updates() persists the diff. The
// loaded struct is mutated by Updates() so we can return it directly
// without a third refetch.
func (s *ContentManifestService) Update(id string, updates map[string]interface{}) (*models.ContentManifest, error) {
	var item models.ContentManifest
	if err := s.DB.First(&item, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("contentmanifest not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating contentmanifest: %w", err)
	}

	return &item, nil
}

// Delete soft-deletes a contentmanifest. One query — we don't need to load
// the row first; GORM's Delete is atomic and rows-affected tells us
// whether it existed.
func (s *ContentManifestService) Delete(id string) error {
	res := s.DB.Where("id = ?", id).Delete(&models.ContentManifest{})
	if res.Error != nil {
		return fmt.Errorf("deleting contentmanifest: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("contentmanifest not found")
	}
	return nil
}
