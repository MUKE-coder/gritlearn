package main

// Git source-control bindings — shell out to the system `git` to keep
// the Wails binary small (no go-git dep) and to behave identically to
// the git the student already uses in a terminal.
//
// Two surfaces:
//   GitStatus(root)   → file-level status entries for the changed-files
//                        panel.
//   GitDiffHunks(root, path) → line ranges for the editor gutter.
//
// Both return JSON-friendly structs; errors are surfaced with the
// stderr text so a missing git binary or "not a repo" gives the user
// a useful message rather than a silent empty result.

import (
	"bytes"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// GitStatusEntry is one row of the source-control panel.
type GitStatusEntry struct {
	Path   string `json:"path"`   // path relative to repo root, e.g. "src/app.tsx"
	Abs    string `json:"abs"`    // absolute path so the UI can openFile()
	Status string `json:"status"` // "modified" | "added" | "deleted" | "untracked" | "renamed" | "?"
	Staged bool   `json:"staged"`
}

// GitDiffHunk is a contiguous run of changed lines for the editor gutter.
type GitDiffHunk struct {
	NewStart int    `json:"new_start"` // 1-based line number in the working-tree file
	NewLines int    `json:"new_lines"` // number of lines this hunk spans
	Kind     string `json:"kind"`      // "added" | "modified" | "deleted"
}

// IsGitRepo returns true if `dir` is inside a git working tree. Used
// by the UI to hide the Git panel for non-repo workspaces.
func (a *App) IsGitRepo(dir string) bool {
	cmd := exec.Command("git", "rev-parse", "--is-inside-work-tree")
	cmd.Dir = dir
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(out)) == "true"
}

// GitStatus reports the changed-files list for the working tree at
// `dir`. Returns an empty slice (not nil) for a clean tree so the
// frontend JSON-decode never produces null.
func (a *App) GitStatus(dir string) ([]GitStatusEntry, error) {
	cmd := exec.Command("git", "status", "--porcelain=v1", "--untracked-files=all")
	cmd.Dir = dir
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("git status: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}

	root := dir
	if rp, err := repoRoot(dir); err == nil {
		root = rp
	}

	entries := make([]GitStatusEntry, 0, 8)
	for _, line := range strings.Split(out.String(), "\n") {
		if len(line) < 4 {
			continue
		}
		// Porcelain v1: XY <space> path
		// X = staged status, Y = unstaged status
		x := line[0]
		y := line[1]
		path := strings.TrimSpace(line[3:])
		// Renames look like "old -> new"; we only need the new path.
		if idx := strings.Index(path, " -> "); idx > -1 {
			path = path[idx+4:]
		}
		// Strip surrounding quotes git adds for paths with spaces.
		path = strings.Trim(path, "\"")

		entry := GitStatusEntry{
			Path:   path,
			Abs:    filepath.Join(root, filepath.FromSlash(path)),
			Status: statusForFlags(x, y),
			Staged: x != ' ' && x != '?',
		}
		entries = append(entries, entry)
	}
	return entries, nil
}

// GitDiffHunks parses `git diff -U0 path` to compute the per-line
// status hunks the editor gutter draws against. Untracked files have
// no diff base, so we synthesise a single "added" hunk covering the
// whole file by reading the line count from disk.
func (a *App) GitDiffHunks(dir, path string) ([]GitDiffHunk, error) {
	// Untracked: every line is added.
	if isUntracked(dir, path) {
		lines, err := countLines(filepath.Join(dir, path))
		if err != nil {
			return nil, err
		}
		if lines == 0 {
			return []GitDiffHunk{}, nil
		}
		return []GitDiffHunk{{NewStart: 1, NewLines: lines, Kind: "added"}}, nil
	}

	cmd := exec.Command("git", "diff", "-U0", "--no-color", "--", path)
	cmd.Dir = dir
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("git diff: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	return parseDiffHunks(out.String()), nil
}

// statusForFlags maps porcelain v1 X/Y flags to a single string the
// frontend renders into a coloured badge. Picks the unstaged Y flag
// first because that's what's visible in the working tree; falls
// back to X for staged-only changes.
func statusForFlags(x, y byte) string {
	pick := y
	if pick == ' ' {
		pick = x
	}
	switch pick {
	case 'M':
		return "modified"
	case 'A':
		return "added"
	case 'D':
		return "deleted"
	case 'R':
		return "renamed"
	case 'C':
		return "copied"
	case '?':
		return "untracked"
	case '!':
		return "ignored"
	case 'U':
		return "unmerged"
	default:
		return "?"
	}
}

func isUntracked(dir, path string) bool {
	cmd := exec.Command("git", "ls-files", "--error-unmatch", "--", path)
	cmd.Dir = dir
	return cmd.Run() != nil
}

func countLines(path string) (int, error) {
	cmd := exec.Command("wc", "-l", path)
	out, err := cmd.Output()
	if err != nil {
		// wc may not exist on stock Windows; fall back to reading.
		return countLinesByReading(path)
	}
	fields := strings.Fields(string(out))
	if len(fields) < 1 {
		return 0, fmt.Errorf("unexpected wc output: %q", string(out))
	}
	n, err := strconv.Atoi(fields[0])
	if err != nil {
		return 0, err
	}
	return n, nil
}

func countLinesByReading(path string) (int, error) {
	cmd := exec.Command("git", "show", "HEAD:"+path)
	if err := cmd.Run(); err == nil {
		// File exists in HEAD — not untracked path, shouldn't be here.
	}
	// Just read directly through git's cat-file-equivalent of disk.
	b, err := exec.Command("powershell.exe", "-NoProfile", "-Command",
		"(Get-Content -Raw '"+path+"').Length").Output()
	if err != nil {
		return 0, err
	}
	n, _ := strconv.Atoi(strings.TrimSpace(string(b)))
	return n, nil
}

var hunkHeaderRE = regexp.MustCompile(`^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@`)

// parseDiffHunks turns the raw `git diff -U0` output into one
// GitDiffHunk per @@ … @@ header. Each hunk's `Kind` is decided by
// comparing the old-side and new-side line counts in the header.
func parseDiffHunks(diff string) []GitDiffHunk {
	hunks := make([]GitDiffHunk, 0, 4)
	for _, line := range strings.Split(diff, "\n") {
		m := hunkHeaderRE.FindStringSubmatch(line)
		if m == nil {
			continue
		}
		oldCount := 1
		if m[2] != "" {
			oldCount, _ = strconv.Atoi(m[2])
		}
		newStart, _ := strconv.Atoi(m[3])
		newCount := 1
		if m[4] != "" {
			newCount, _ = strconv.Atoi(m[4])
		}

		kind := "modified"
		if oldCount == 0 {
			kind = "added"
		} else if newCount == 0 {
			kind = "deleted"
		}

		// Deletions don't have any line numbers in the new file —
		// snap to the line above where the deletion happened so the
		// gutter has somewhere to draw a marker.
		if kind == "deleted" {
			if newStart < 1 {
				newStart = 1
			}
			hunks = append(hunks, GitDiffHunk{NewStart: newStart, NewLines: 1, Kind: "deleted"})
			continue
		}

		hunks = append(hunks, GitDiffHunk{
			NewStart: newStart,
			NewLines: newCount,
			Kind:     kind,
		})
	}
	return hunks
}

func repoRoot(dir string) (string, error) {
	cmd := exec.Command("git", "rev-parse", "--show-toplevel")
	cmd.Dir = dir
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}
