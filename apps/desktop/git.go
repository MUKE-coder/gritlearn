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

// _ keeps strconv used in case future edits drop the last consumer
// — the import is also used by GitBranch's ahead/behind parsing.
var _ = strconv.Atoi

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

// ─── Write ops ────────────────────────────────────────────────

// GitBranchInfo describes the current branch + its upstream tracking
// state so the UI can show "main → origin/main, 2 ahead" without
// having to make three separate calls.
type GitBranchInfo struct {
	Branch   string `json:"branch"`
	Upstream string `json:"upstream"`
	Ahead    int    `json:"ahead"`
	Behind   int    `json:"behind"`
}

// GitBranch returns the current branch + upstream tracking. Detached
// HEAD reports the short SHA in Branch.
func (a *App) GitBranch(dir string) (GitBranchInfo, error) {
	info := GitBranchInfo{}
	br, err := runGit(dir, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return info, err
	}
	br = strings.TrimSpace(br)
	if br == "HEAD" {
		// Detached — use short SHA so the UI shows something useful.
		sha, _ := runGit(dir, "rev-parse", "--short", "HEAD")
		info.Branch = strings.TrimSpace(sha)
		return info, nil
	}
	info.Branch = br

	// upstream + ahead/behind. Quiet failure when no upstream is set —
	// the user just hasn't pushed yet.
	up, err := runGit(dir, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
	if err != nil {
		return info, nil
	}
	info.Upstream = strings.TrimSpace(up)
	counts, err := runGit(dir, "rev-list", "--left-right", "--count", "HEAD..."+info.Upstream)
	if err == nil {
		parts := strings.Fields(strings.TrimSpace(counts))
		if len(parts) == 2 {
			info.Ahead, _ = strconv.Atoi(parts[0])
			info.Behind, _ = strconv.Atoi(parts[1])
		}
	}
	return info, nil
}

// GitStage adds files to the index. Pass an empty slice to stage
// everything (`git add -A`).
func (a *App) GitStage(dir string, paths []string) error {
	args := []string{"add"}
	if len(paths) == 0 {
		args = append(args, "-A")
	} else {
		args = append(args, "--")
		args = append(args, paths...)
	}
	_, err := runGit(dir, args...)
	return err
}

// GitUnstage moves changes back out of the index (`git reset HEAD -- path`).
func (a *App) GitUnstage(dir string, paths []string) error {
	args := []string{"reset", "HEAD"}
	if len(paths) > 0 {
		args = append(args, "--")
		args = append(args, paths...)
	}
	_, err := runGit(dir, args...)
	return err
}

// GitDiscard reverts uncommitted changes for `paths` (`git checkout --`).
// For untracked files, this is a no-op — git itself rejects them.
func (a *App) GitDiscard(dir string, paths []string) error {
	if len(paths) == 0 {
		return fmt.Errorf("no paths supplied")
	}
	args := append([]string{"checkout", "--"}, paths...)
	_, err := runGit(dir, args...)
	return err
}

// GitCommit creates a commit with the supplied message. The UI is
// expected to have staged the files first. Returns the resulting
// commit SHA so the caller can show "Committed abc1234".
func (a *App) GitCommit(dir, message string) (string, error) {
	if strings.TrimSpace(message) == "" {
		return "", fmt.Errorf("commit message is empty")
	}
	if _, err := runGit(dir, "commit", "-m", message); err != nil {
		return "", err
	}
	sha, _ := runGit(dir, "rev-parse", "--short", "HEAD")
	return strings.TrimSpace(sha), nil
}

// GitPush pushes the current branch to its upstream. If no upstream is
// configured, calls `git push --set-upstream origin <branch>` so the
// first push from a brand-new branch "just works".
func (a *App) GitPush(dir string) (string, error) {
	info, _ := a.GitBranch(dir)
	if info.Upstream == "" && info.Branch != "" {
		out, err := runGit(dir, "push", "--set-upstream", "origin", info.Branch)
		return out, err
	}
	return runGit(dir, "push")
}

// GitPull fetches + fast-forwards the current branch.
func (a *App) GitPull(dir string) (string, error) {
	return runGit(dir, "pull", "--ff-only")
}

// GitInit creates a new git repo in `dir` so the Git panel comes
// alive without the student having to drop into the terminal.
func (a *App) GitInit(dir string) error {
	_, err := runGit(dir, "init")
	return err
}

// runGit shells out to `git` with the supplied args in `dir`. Returns
// stdout + stderr combined so the caller can surface failures in the
// UI. Errors include the git exit-status text.
func runGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		return out.String(), fmt.Errorf("git %s: %w (%s)", strings.Join(args, " "), err, strings.TrimSpace(out.String()))
	}
	return out.String(), nil
}
