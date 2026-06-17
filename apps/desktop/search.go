package main

// Workspace-wide search + replace. Walks the open folder, matches each
// line against the query, returns hits + line context for the panel.
//
// We don't shell out to ripgrep — students rarely have it installed,
// and the workspaces we care about are small (Phase 1 / Phase 4
// project skeletons). Plain bufio scan covers them in well under a
// second.

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// SearchHit represents one match line. Multiple hits in a single
// line collapse into one entry — the panel can highlight via
// startCol+endCol but we don't re-emit the line for each match.
type SearchHit struct {
	Path     string `json:"path"`     // absolute
	Rel      string `json:"rel"`      // relative to workspace root
	Line     int    `json:"line"`     // 1-based
	LineText string `json:"line_text"`
	StartCol int    `json:"start_col"` // 0-based UTF-8 byte offset
	EndCol   int    `json:"end_col"`
}

// SearchRequest configures one search pass. Used as the only argument
// to SearchWorkspace so the binding stays stable as new options are
// added (caseSensitive, includeGlob, …).
type SearchRequest struct {
	Query         string `json:"query"`
	IsRegex       bool   `json:"is_regex"`
	CaseSensitive bool   `json:"case_sensitive"`
	WholeWord     bool   `json:"whole_word"`
	IncludeGlob   string `json:"include_glob"` // e.g. "*.ts" — empty matches all
	ExcludeGlob   string `json:"exclude_glob"`
}

// File extensions we never look inside — binaries + lock files where
// matches are either noise or huge.
var skipExtensions = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true,
	".ico": true, ".svg": false, // svg is text — keep
	".pdf": true, ".zip": true, ".tar": true, ".gz": true,
	".exe": true, ".dll": true, ".dylib": true, ".so": true,
	".woff": true, ".woff2": true, ".ttf": true, ".otf": true,
	".mp3": true, ".mp4": true, ".mov": true, ".webm": true,
}

// Directories we always skip — vendoring + build output.
var skipDirs = map[string]bool{
	"node_modules": true, ".git": true, "dist": true, "build": true,
	".next": true, ".cache": true, "target": true, ".turbo": true,
	".vscode": true, ".idea": true, "vendor": true,
}

// SearchWorkspace walks `root` and returns every match (capped at
// maxHits to keep the panel responsive). Empty query returns an
// empty slice with no error.
func (a *App) SearchWorkspace(root string, req SearchRequest) ([]SearchHit, error) {
	const maxHits = 1000
	const maxLineLen = 2000 // truncate huge generated lines

	if req.Query == "" {
		return []SearchHit{}, nil
	}

	matcher, err := buildMatcher(req)
	if err != nil {
		return nil, err
	}

	includeGlob := strings.TrimSpace(req.IncludeGlob)
	excludeGlob := strings.TrimSpace(req.ExcludeGlob)

	hits := make([]SearchHit, 0, 64)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	err = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip unreadable nodes silently
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		base := info.Name()
		if info.IsDir() {
			if skipDirs[base] || strings.HasPrefix(base, ".") && base != "." {
				return filepath.SkipDir
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(base))
		if skipExtensions[ext] {
			return nil
		}
		// Glob filters operate on the basename so authors can write
		// "*.ts" without having to think about path separators.
		if includeGlob != "" {
			ok, _ := filepath.Match(includeGlob, base)
			if !ok {
				return nil
			}
		}
		if excludeGlob != "" {
			ok, _ := filepath.Match(excludeGlob, base)
			if ok {
				return nil
			}
		}

		f, err := os.Open(path)
		if err != nil {
			return nil
		}
		defer f.Close()

		// Reject obviously-binary files: read the first kilobyte and
		// look for NULs.
		head := make([]byte, 1024)
		n, _ := f.Read(head)
		if containsNUL(head[:n]) {
			return nil
		}
		_, err = f.Seek(0, 0)
		if err != nil {
			return nil
		}

		scanner := bufio.NewScanner(f)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		lineno := 0
		rel, _ := filepath.Rel(root, path)
		if rel == "" {
			rel = base
		}
		for scanner.Scan() {
			lineno++
			line := scanner.Text()
			if len(line) > maxLineLen {
				continue
			}
			startCol, endCol, ok := matcher(line)
			if !ok {
				continue
			}
			hits = append(hits, SearchHit{
				Path:     path,
				Rel:      filepath.ToSlash(rel),
				Line:     lineno,
				LineText: line,
				StartCol: startCol,
				EndCol:   endCol,
			})
			if len(hits) >= maxHits {
				cancel()
				return errStopSearch
			}
		}
		return nil
	})

	if err != nil && !errors.Is(err, errStopSearch) && !errors.Is(err, context.Canceled) {
		return nil, err
	}
	return hits, nil
}

var errStopSearch = errors.New("search: hit cap reached")

// buildMatcher returns a closure that finds the first match in a
// line + reports the byte offsets. Encoding is UTF-8 throughout so
// the offsets line up with what Monaco's column counter uses.
func buildMatcher(req SearchRequest) (func(line string) (int, int, bool), error) {
	q := req.Query

	if req.IsRegex {
		flags := ""
		if !req.CaseSensitive {
			flags = "(?i)"
		}
		body := q
		if req.WholeWord {
			body = `\b(?:` + body + `)\b`
		}
		re, err := regexp.Compile(flags + body)
		if err != nil {
			return nil, fmt.Errorf("bad regex: %w", err)
		}
		return func(line string) (int, int, bool) {
			loc := re.FindStringIndex(line)
			if loc == nil {
				return 0, 0, false
			}
			return loc[0], loc[1], true
		}, nil
	}

	if req.WholeWord {
		flags := ""
		if !req.CaseSensitive {
			flags = "(?i)"
		}
		re, err := regexp.Compile(flags + `\b` + regexp.QuoteMeta(q) + `\b`)
		if err != nil {
			return nil, err
		}
		return func(line string) (int, int, bool) {
			loc := re.FindStringIndex(line)
			if loc == nil {
				return 0, 0, false
			}
			return loc[0], loc[1], true
		}, nil
	}

	if req.CaseSensitive {
		return func(line string) (int, int, bool) {
			idx := strings.Index(line, q)
			if idx < 0 {
				return 0, 0, false
			}
			return idx, idx + len(q), true
		}, nil
	}
	qLower := strings.ToLower(q)
	return func(line string) (int, int, bool) {
		idx := strings.Index(strings.ToLower(line), qLower)
		if idx < 0 {
			return 0, 0, false
		}
		return idx, idx + len(q), true
	}, nil
}

func containsNUL(b []byte) bool {
	for _, c := range b {
		if c == 0 {
			return true
		}
	}
	return false
}

// ReplaceInFile performs a single replace pass on `path` using the
// same matching rules as SearchWorkspace. Returns the count of
// replacements made so the UI can report "Replaced 12 occurrences".
// Atomic via temp-file rename — a crash mid-write can't corrupt the
// source.
func (a *App) ReplaceInFile(path string, req SearchRequest, replacement string) (int, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return 0, fmt.Errorf("read %s: %w", path, err)
	}
	content := string(b)
	count := 0
	var out string

	if req.IsRegex {
		flags := ""
		if !req.CaseSensitive {
			flags = "(?i)"
		}
		body := req.Query
		if req.WholeWord {
			body = `\b(?:` + body + `)\b`
		}
		re, err := regexp.Compile(flags + body)
		if err != nil {
			return 0, fmt.Errorf("bad regex: %w", err)
		}
		out = re.ReplaceAllStringFunc(content, func(match string) string {
			count++
			// $1..$9 backreferences supported via re.ReplaceAllString
			// would be more natural but ReplaceAllStringFunc gives us
			// the count; pay literal-replacement cost for the count.
			return replacement
		})
	} else if req.WholeWord {
		flags := ""
		if !req.CaseSensitive {
			flags = "(?i)"
		}
		re, err := regexp.Compile(flags + `\b` + regexp.QuoteMeta(req.Query) + `\b`)
		if err != nil {
			return 0, err
		}
		out = re.ReplaceAllStringFunc(content, func(_ string) string {
			count++
			return replacement
		})
	} else if req.CaseSensitive {
		out = content
		count = strings.Count(out, req.Query)
		if count > 0 {
			out = strings.ReplaceAll(out, req.Query, replacement)
		}
	} else {
		lower := strings.ToLower(content)
		qLower := strings.ToLower(req.Query)
		var b strings.Builder
		i := 0
		for {
			idx := strings.Index(lower[i:], qLower)
			if idx < 0 {
				b.WriteString(content[i:])
				break
			}
			b.WriteString(content[i : i+idx])
			b.WriteString(replacement)
			i = i + idx + len(req.Query)
			count++
		}
		out = b.String()
	}

	if count == 0 {
		return 0, nil
	}

	if err := a.WriteFile(path, out); err != nil {
		return 0, err
	}
	return count, nil
}
