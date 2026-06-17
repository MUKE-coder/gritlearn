// Workspace-wide search + replace. Lives in the Files-panel column
// (toggled via the top bar's "Search" button). Plain-text search by
// default; toggle pills enable regex, case-sensitive, whole-word.
//
// Results group by file. Clicking a result opens the file at the
// matched line. Replace runs file-by-file via ReplaceInFile so a mid-
// pass failure doesn't leave the workspace half-rewritten.

import { useCallback, useEffect, useRef, useState } from "react";
import { CaseSensitive, ChevronDown, ChevronRight, Loader2, RegexIcon, Replace, Search as SearchIcon, WholeWord } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface SearchHit {
  path: string;
  rel: string;
  line: number;
  line_text: string;
  start_col: number;
  end_col: number;
}

type GroupedHits = Record<string, SearchHit[]>;

export function SearchPanel() {
  const { rootPath, openFile } = useWorkspace();
  const [query, setQuery] = useState("");
  const [replace, setReplace] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [includeGlob, setIncludeGlob] = useState("");
  const [excludeGlob, setExcludeGlob] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const grouped: GroupedHits = hits.reduce<GroupedHits>((acc, h) => {
    (acc[h.rel] ||= []).push(h);
    return acc;
  }, {});
  const fileCount = Object.keys(grouped).length;

  const runSearch = useCallback(async () => {
    if (!rootPath || !query.trim()) {
      setHits([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const result = (await App.SearchWorkspace(rootPath, {
        query,
        is_regex: isRegex,
        case_sensitive: caseSensitive,
        whole_word: wholeWord,
        include_glob: includeGlob,
        exclude_glob: excludeGlob,
      })) as SearchHit[];
      setHits(result ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, [rootPath, query, isRegex, caseSensitive, wholeWord, includeGlob, excludeGlob]);

  // Debounce: 300ms after the user stops typing fire a fresh search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runSearch]);

  const runReplaceAll = async () => {
    if (!confirm(`Replace ${hits.length} occurrence(s) across ${fileCount} file(s)?`)) return;
    setSearching(true);
    setError(null);
    let total = 0;
    try {
      for (const filePath of Object.keys(grouped)) {
        const abs = grouped[filePath][0].path;
        const n = (await App.ReplaceInFile(abs, {
          query,
          is_regex: isRegex,
          case_sensitive: caseSensitive,
          whole_word: wholeWord,
          include_glob: "",
          exclude_glob: "",
        }, replace)) as number;
        total += n;
      }
      await runSearch();
      alert(`Replaced ${total} occurrence(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const openAt = (hit: SearchHit) => {
    void openFile(hit.path, hit.line);
  };

  return (
    <div className="flex h-full flex-col bg-surface-1 text-[12.5px]">
      <div className="space-y-2 border-b border-border-subtle px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            Search
          </span>
          <button
            onClick={() => setShowReplace((v) => !v)}
            title={showReplace ? "Hide replace" : "Show replace"}
            className={`rounded p-1 ${showReplace ? "bg-accent/15 text-accent" : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"}`}
          >
            <Replace className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-8 w-full rounded border border-border bg-surface-2 pl-7 pr-2 font-mono text-foreground placeholder:text-foreground-muted"
          />
        </div>
        {showReplace && (
          <div className="relative">
            <Replace className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replace with…"
              className="h-8 w-full rounded border border-border bg-surface-2 pl-7 pr-2 font-mono text-foreground placeholder:text-foreground-muted"
            />
            <button
              onClick={() => void runReplaceAll()}
              disabled={hits.length === 0 || searching}
              className="mt-1 h-7 w-full rounded bg-accent text-[11.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-40"
            >
              Replace All in {fileCount} file{fileCount === 1 ? "" : "s"}
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <TogglePill active={caseSensitive} onClick={() => setCaseSensitive((v) => !v)} title="Match case">
            <CaseSensitive className="h-3.5 w-3.5" />
          </TogglePill>
          <TogglePill active={wholeWord} onClick={() => setWholeWord((v) => !v)} title="Whole word">
            <WholeWord className="h-3.5 w-3.5" />
          </TogglePill>
          <TogglePill active={isRegex} onClick={() => setIsRegex((v) => !v)} title="Regex">
            <RegexIcon className="h-3.5 w-3.5" />
          </TogglePill>
          <div className="ml-auto text-[10px] font-mono text-foreground-muted">
            {searching ? "…" : `${hits.length} hit${hits.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <details className="text-[10px] text-foreground-muted">
          <summary className="cursor-pointer">files to include / exclude</summary>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <input
              value={includeGlob}
              onChange={(e) => setIncludeGlob(e.target.value)}
              placeholder="include *.ts"
              className="h-6 rounded border border-border bg-surface-2 px-1.5 font-mono text-foreground placeholder:text-foreground-muted"
            />
            <input
              value={excludeGlob}
              onChange={(e) => setExcludeGlob(e.target.value)}
              placeholder="exclude *.test.ts"
              className="h-6 rounded border border-border bg-surface-2 px-1.5 font-mono text-foreground placeholder:text-foreground-muted"
            />
          </div>
        </details>
      </div>

      {error && (
        <div className="border-b border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {!rootPath ? (
          <div className="px-3 py-4 text-[12px] text-foreground-muted">Open a folder to search.</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="px-3 py-4 text-[12px] text-foreground-muted">
            {searching ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</span>
            ) : query.trim() ? "No matches." : "Type to search the open folder."}
          </div>
        ) : (
          Object.entries(grouped).map(([file, fileHits]) => {
            const isCollapsed = collapsed[file];
            return (
              <div key={file} className="mb-1">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [file]: !c[file] }))}
                  className="flex w-full items-center gap-1 px-2 py-0.5 text-left hover:bg-surface-2"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-foreground-muted" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-foreground-muted" />
                  )}
                  <span className="truncate font-mono text-[12px] text-foreground">{file}</span>
                  <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                    {fileHits.length}
                  </span>
                </button>
                {!isCollapsed &&
                  fileHits.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => openAt(h)}
                      title={`line ${h.line}`}
                      className="block w-full truncate py-0.5 pl-7 pr-2 text-left font-mono text-[11.5px] text-foreground-secondary hover:bg-surface-2"
                    >
                      <span className="text-foreground-muted">{h.line}: </span>
                      <HitLine text={h.line_text} startCol={h.start_col} endCol={h.end_col} />
                    </button>
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HitLine({ text, startCol, endCol }: { text: string; startCol: number; endCol: number }) {
  // Truncate huge lines on the left/right of the match so the
  // panel doesn't blow out horizontally.
  const max = 160;
  const left = Math.max(0, startCol - 40);
  const right = Math.min(text.length, endCol + 120);
  const slice = text.slice(left, right);
  const leftEllipsis = left > 0 ? "…" : "";
  const rightEllipsis = right < text.length ? "…" : "";
  const innerStart = startCol - left;
  const innerEnd = endCol - left;
  const before = slice.slice(0, innerStart);
  const middle = slice.slice(innerStart, innerEnd);
  const after = slice.slice(innerEnd, Math.min(slice.length, max));
  return (
    <>
      {leftEllipsis}
      {before}
      <span className="rounded bg-accent/30 text-foreground">{middle}</span>
      {after}
      {rightEllipsis}
    </>
  );
}

function TogglePill({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex h-6 w-7 items-center justify-center rounded border ${
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-surface-2 text-foreground-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
