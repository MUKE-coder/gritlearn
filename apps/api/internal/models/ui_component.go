package models

import "time"

// UIComponent stores a shadcn-compatible UI component in the database.
// Components are served as a public registry at GET /r.json and GET /r/:name.json.
type UIComponent struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	Name         string    `gorm:"size:100;uniqueIndex" json:"name"`        // slug: "hero-01"
	DisplayName  string    `gorm:"size:200" json:"display_name"`            // "Hero Section"
	Description  string    `gorm:"type:text" json:"description"`
	Category     string    `gorm:"size:50;index" json:"category"`           // "marketing","ecommerce","layout"
	Tags         string    `gorm:"type:text" json:"tags"`                  // JSON: ["hero","landing"]
	Files        string    `gorm:"type:text" json:"files"`                 // JSON: shadcn files array
	Dependencies string    `gorm:"type:text" json:"dependencies"`          // JSON: ["lucide-react"]
	RegistryDeps string    `gorm:"type:text" json:"registry_deps"`         // JSON: other grit-ui component deps
	PreviewCode  string    `gorm:"type:text" json:"preview_code"`          // short JSX snippet for browser
	IsPublic     bool      `gorm:"default:true" json:"is_public"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
