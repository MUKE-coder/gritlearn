package main

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// curriculumFS bundles the entire content/ tree (manifest + every MDX +
// every example starter folder) into the desktop binary. The student can
// run fully offline because every byte the curriculum needs already
// lives inside the executable.
//
//go:embed all:content
var curriculumFS embed.FS

// GetManifest returns the raw bytes of content/manifest.json. The
// frontend parses it as JSON — keeping it raw on the Go side means
// adding a new field later only requires updating the manifest.json,
// not also bumping a Go struct.
func (a *App) GetManifest() (string, error) {
	b, err := curriculumFS.ReadFile("content/manifest.json")
	if err != nil {
		return "", fmt.Errorf("read manifest: %w", err)
	}
	return string(b), nil
}

// GetConceptMDX returns the MDX source for a concept slug like
// "phase-01/how-the-web-works". A leading slash or trailing slash on
// the slug is tolerated so the frontend doesn't have to normalize.
func (a *App) GetConceptMDX(slug string) (string, error) {
	slug = strings.Trim(slug, "/")
	if slug == "" {
		return "", fmt.Errorf("concept slug is empty")
	}
	// path.Clean uses forward slashes (embed.FS only speaks forward
	// slashes regardless of host OS), which is exactly what we want.
	rel := path.Join("content", slug, "concept.mdx")
	b, err := curriculumFS.ReadFile(rel)
	if err != nil {
		return "", fmt.Errorf("read concept %s: %w", slug, err)
	}
	return string(b), nil
}

// CurriculumHit is one match returned by SearchCurriculum. Path is
// the concept slug so the UI can jump straight to it; Excerpt holds
// the snippet of MDX around the hit (with surrounding context).
type CurriculumHit struct {
	Slug    string `json:"slug"`
	Title   string `json:"title"`
	Excerpt string `json:"excerpt"`
	Line    int    `json:"line"`
}

// SearchCurriculum walks every bundled concept.mdx and returns up to
// 50 hits ranked by where the match lands (title > heading > body).
// Case-insensitive, no regex.
func (a *App) SearchCurriculum(query string) ([]CurriculumHit, error) {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return []CurriculumHit{}, nil
	}
	const maxHits = 50

	hits := make([]CurriculumHit, 0, 32)
	err := fs.WalkDir(curriculumFS, "content", func(p string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() || filepath.Base(p) != "concept.mdx" {
			return nil
		}
		b, err := curriculumFS.ReadFile(p)
		if err != nil {
			return nil
		}
		text := string(b)
		lower := strings.ToLower(text)
		idx := strings.Index(lower, q)
		if idx == -1 {
			return nil
		}
		// Slug is the parent directory under content/.
		slug := strings.TrimPrefix(strings.TrimSuffix(p, "/concept.mdx"), "content/")

		// Title heuristic — first "# " heading in the MDX.
		title := slug
		if m := firstHeading(text); m != "" {
			title = m
		}

		// Build a ±80 char excerpt around the hit.
		start := idx - 80
		if start < 0 {
			start = 0
		}
		end := idx + 80
		if end > len(text) {
			end = len(text)
		}
		excerpt := strings.ReplaceAll(text[start:end], "\n", " ")
		// Compute the 1-based line of the hit so the UI can jump there.
		line := 1 + strings.Count(text[:idx], "\n")

		hits = append(hits, CurriculumHit{
			Slug:    slug,
			Title:   title,
			Excerpt: excerpt,
			Line:    line,
		})
		if len(hits) >= maxHits {
			return fmt.Errorf("__cap__")
		}
		return nil
	})
	if err != nil && err.Error() != "__cap__" {
		return nil, err
	}
	return hits, nil
}

// firstHeading returns the text of the first "# " heading in the
// supplied MDX source. Used to surface a friendly title in search
// results without having to round-trip the slug through the manifest.
func firstHeading(src string) string {
	for _, line := range strings.Split(src, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "# ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "#"))
		}
	}
	return ""
}

// ExampleInfo is the on-the-wire shape of one example project that
// ships with a concept. The frontend lists these in the <ExampleProject>
// teaching block; clicking "Open" calls OpenExampleProject below.
type ExampleInfo struct {
	ID   string `json:"id"`   // folder name under the concept's examples/ dir
	Name string `json:"name"` // human-friendly name, falls back to ID
}

// ListExamples reports the example-project folders bundled with a
// concept. We just enumerate child directories under
// content/<slug>/examples/ — no metadata file required, so writing a
// new lesson stays cheap.
func (a *App) ListExamples(slug string) ([]ExampleInfo, error) {
	slug = strings.Trim(slug, "/")
	dir := path.Join("content", slug, "examples")
	entries, err := curriculumFS.ReadDir(dir)
	if err != nil {
		// No examples dir = no examples. Not an error — concepts can
		// legitimately ship without examples (e.g. pure-theory pages).
		return []ExampleInfo{}, nil
	}
	out := make([]ExampleInfo, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		out = append(out, ExampleInfo{ID: e.Name(), Name: e.Name()})
	}
	return out, nil
}

// OpenExampleProject copies the bundled starter for (slug, exampleID)
// into the student's workspace dir under
//
//	<user-config>/gritlearn/workspaces/<slug>/<exampleID>
//
// and returns the absolute destination path. Re-opening an example
// re-copies on top — the embedded version is the source of truth, so
// the student can always reset by re-opening. (We may swap this for a
// "skip if exists" prompt in B12.)
func (a *App) OpenExampleProject(slug, exampleID string) (string, error) {
	slug = strings.Trim(slug, "/")
	if slug == "" || exampleID == "" {
		return "", fmt.Errorf("slug and exampleID required")
	}

	srcDir := path.Join("content", slug, "examples", exampleID)
	// Guard against ".." escapes in case a manifest is ever crafted
	// maliciously — fs.Sub validates the path.
	sub, err := fs.Sub(curriculumFS, srcDir)
	if err != nil {
		return "", fmt.Errorf("locate example %s/%s: %w", slug, exampleID, err)
	}

	dataDir, err := os.UserConfigDir()
	if err != nil {
		// UserConfigDir very rarely fails on supported platforms; fall
		// back to home so the open still works on weird environments.
		dataDir, _ = os.UserHomeDir()
	}
	dst := filepath.Join(dataDir, "gritlearn", "workspaces", filepath.FromSlash(slug), exampleID)
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return "", fmt.Errorf("mkdir %s: %w", dst, err)
	}

	// Walk the embedded subtree and mirror it to disk.
	err = fs.WalkDir(sub, ".", func(p string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		target := filepath.Join(dst, filepath.FromSlash(p))
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		data, err := fs.ReadFile(sub, p)
		if err != nil {
			return fmt.Errorf("read embedded %s: %w", p, err)
		}
		if err := os.WriteFile(target, data, 0o644); err != nil {
			return fmt.Errorf("write %s: %w", target, err)
		}
		return nil
	})
	if err != nil {
		return "", err
	}

	return dst, nil
}
