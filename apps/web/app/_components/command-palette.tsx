"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface SearchHitDto {
  cat?: string;
  date: string;
  id: string;
  kind: string;
  matchedFields: string[];
  score: number;
  section?: string;
  slug: string;
  sum: string;
  tag: string;
  title: string;
}

interface SearchResponse {
  items: SearchHitDto[];
  total: number;
}

const QUERY_DEBOUNCE_MS = 150;

/**
 * Full-text command-palette search modal (issue #99).
 *
 * - ⌘K / Ctrl+K toggle — registered globally, listened for as long as
 *   the component is mounted (top nav owns the mount).
 * - Esc and click-on-backdrop both close.
 * - Arrow keys + Enter navigate the result list; Enter on a highlighted
 *   item routes to the right detail page (`/stories/<slug>` for brand,
 *   `/readers/<slug>` for social kinds).
 * - Empty query renders an empty-state hint; non-empty with no hits
 *   renders a no-results message; results render with a relevance
 *   badge per hit.
 *
 * The runtime querying happens against `/api/search?q=`; the modal
 * itself is a thin presentation shell.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K toggle, plus a custom 'verda:command-palette' event so
  // any in-app surface (e.g. the nav search icon) can open the palette
  // imperatively. Both are listened for as long as the component is
  // mounted (top nav owns the mount).
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("verda:command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("verda:command-palette", onOpenEvent);
    };
  }, [open]);

  // Focus the input when the modal opens.
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    return;
  }, [open]);

  // Debounce the query so we don't fire a fetch on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  const resultsQuery = useQuery<SearchResponse>({
    queryKey: ["search", debounced],
    queryFn: async () => {
      if (!debounced.trim()) {
        return { items: [], total: 0 };
      }
      const params = new URLSearchParams({ q: debounced, limit: "8" });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) {
        throw new Error("Search failed");
      }
      return (await res.json()) as SearchResponse;
    },
    enabled: open,
  });

  const items = resultsQuery.data?.items ?? [];

  // Reset highlight whenever the result set changes.
  useEffect(() => {
    setHighlight(0);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const navigate = useCallback(
    (hit: SearchHitDto) => {
      const path =
        hit.kind === "submission" ||
        hit.kind === "repost" ||
        hit.kind === "remix"
          ? `/readers/${hit.slug}`
          : `/stories/${hit.slug}`;
      close();
      router.push(path);
    },
    [router, close]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      const hit = items[highlight];
      if (hit) {
        e.preventDefault();
        navigate(hit);
      }
    }
  };

  if (!open) {
    return (
      <button
        aria-label="Open search"
        className="hidden"
        data-testid="cmdk-trigger"
        onClick={() => setOpen(true)}
        type="button"
      />
    );
  }

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
    >
      <button
        aria-label="Close search"
        className="absolute inset-0 z-0 bg-ink/40"
        onClick={close}
        type="button"
      />
      <div
        aria-label="Search"
        aria-modal="true"
        className="relative z-10 w-full max-w-[640px] border border-ink bg-paper shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-line border-b px-4 py-3">
          <span aria-hidden className="font-mono text-[12px] text-muted">
            ⌘K
          </span>
          <input
            aria-label="Search articles"
            className="w-full bg-transparent font-display text-[18px] text-ink outline-none placeholder:text-muted"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search stories, summaries, tags, body text…"
            ref={inputRef}
            value={query}
          />
          <button
            aria-label="Close search"
            className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]"
            onClick={close}
            type="button"
          >
            Esc
          </button>
        </div>

        <ResultsList
          highlight={highlight}
          isLoading={resultsQuery.isLoading && !!debounced.trim()}
          items={items}
          onPick={navigate}
          query={debounced}
          setHighlight={setHighlight}
        />

        <div className="border-line border-t px-4 py-2 font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
          ↑ ↓ navigate · ↵ open · Esc close
        </div>
      </div>
    </div>
  );
}

function ResultsList({
  highlight,
  isLoading,
  items,
  onPick,
  query,
  setHighlight,
}: {
  highlight: number;
  isLoading: boolean;
  items: SearchHitDto[];
  onPick: (hit: SearchHitDto) => void;
  query: string;
  setHighlight: (n: number) => void;
}) {
  if (!query.trim()) {
    return (
      <div className="px-4 py-10 text-center font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
        Type to search across titles, summaries, tags, sections, and body text.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="px-4 py-10 text-center font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
        Searching…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
        No results for "{query}"
      </div>
    );
  }
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {items.map((hit, i) => {
        const active = i === highlight;
        return (
          <button
            aria-current={active}
            className={`flex w-full cursor-pointer items-start gap-3 border-line border-b px-4 py-3 text-left ${
              active ? "bg-vermilion/10" : ""
            }`}
            key={hit.id}
            onClick={() => onPick(hit)}
            onMouseEnter={() => setHighlight(i)}
            type="button"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display font-medium text-[15px] text-ink">
                  {hit.title}
                </span>
                <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
                  {hit.kind}
                </span>
              </div>
              {hit.sum && (
                <p className="mt-1 line-clamp-2 font-display text-[13px] text-ink-soft leading-[1.4]">
                  {hit.sum}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                {hit.matchedFields.map((f) => (
                  <span
                    className="border border-line px-[6px] py-[1px]"
                    key={f}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            {active && (
              <span
                aria-hidden
                className="font-mono text-[10px] text-vermilion uppercase tracking-[0.16em]"
              >
                ↵ Open
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
