package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"gritlearn/apps/api/internal/models"
)

// ProgressService handles business logic for progresses.
type ProgressService struct {
	DB *gorm.DB
}

// ProgressListParams holds pagination and filter parameters.
type ProgressListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of progresses.
func (s *ProgressService) List(params ProgressListParams) ([]models.Progress, int64, int, error) {
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

	query := s.DB.Model(&models.Progress{})

	if params.Search != "" {
		query = query.Where("user_id ILIKE ? OR concept_slug ILIKE ? OR status ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Progress
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching progresses: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single progress by ID.
func (s *ProgressService) GetByID(id string) (*models.Progress, error) {
	var item models.Progress
	if err := s.DB.First(&item, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("progress not found: %w", err)
	}
	return &item, nil
}

// Create creates a new progress.
func (s *ProgressService) Create(item *models.Progress) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating progress: %w", err)
	}
	return nil
}

// Update modifies an existing progress. Two queries: First() loads
// the row + verifies existence; Updates() persists the diff. The
// loaded struct is mutated by Updates() so we can return it directly
// without a third refetch.
func (s *ProgressService) Update(id string, updates map[string]interface{}) (*models.Progress, error) {
	var item models.Progress
	if err := s.DB.First(&item, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("progress not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating progress: %w", err)
	}

	return &item, nil
}

// Delete soft-deletes a progress. One query — we don't need to load
// the row first; GORM's Delete is atomic and rows-affected tells us
// whether it existed.
func (s *ProgressService) Delete(id string) error {
	res := s.DB.Where("id = ?", id).Delete(&models.Progress{})
	if res.Error != nil {
		return fmt.Errorf("deleting progress: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("progress not found")
	}
	return nil
}
