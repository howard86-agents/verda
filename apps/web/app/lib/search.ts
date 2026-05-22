import { SECTIONS } from "@verda/data";
import type { Article } from "./db";

/**
 * Full-text search ranker for the command-palette (issue #99).
 *
 * Scans across title, summary, tags, section name, and the flattened
 * `bodyJson` text. Pure helper — both the API handler and the unit
 * tests run against `searchArticles()` directly.
 *
 * Ranking weights:
 *   - title:   per-occurrence ×10, prefix bonus +20
 *   - summary: per-occurrence ×5
 *   - tag:     per-occurrence ×4
 *   - section: per-occurrence ×4
 *   - body:    per-occurrence ×1
 *
 * Empty query returns an empty result. The ranker is case-insensitive,
 * matches by substring (no fuzzy), and de-duplicates by article id.
 */

export interface SearchHit {
  article: Article;
  matchedFields: string[];
  score: number;
}

const TITLE_WEIGHT = 10;
const TITLE_PREFIX_BONUS = 20;
const SUMMARY_WEIGHT = 5;
const TAG_WEIGHT = 4;
const SECTION_WEIGHT = 4;
const BODY_WEIGHT = 1;

/**
 * Walk a Tiptap-style `bodyJson` document and collect every `text`
 * leaf joined with spaces. Returns the empty string if the body is
 * unset or malformed.
 */
export function flattenBodyJson(bodyJson: string | undefined): string {
  if (!bodyJson) {
    return "";
  }
  try {
    return walk(JSON.parse(bodyJson)).trim();
  } catch {
    return "";
  }
}

function walk(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") {
    return n.text;
  }
  if (Array.isArray(n.content)) {
    return (n.content as unknown[]).map(walk).join(" ");
  }
  return "";
}

function countOccurrences(haystack: string, needle: string): number {
  if (!(haystack && needle)) {
    return 0;
  }
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let from = 0;
  while (true) {
    const at = h.indexOf(n, from);
    if (at === -1) {
      break;
    }
    count += 1;
    from = at + n.length;
  }
  return count;
}

function sectionNameFor(article: Article): string {
  if (!article.section) {
    return article.cat ?? "";
  }
  return (
    SECTIONS.find((s) => s.id === article.section)?.name ?? article.cat ?? ""
  );
}

function scoreArticle(article: Article, query: string): SearchHit | null {
  const matchedFields: string[] = [];
  let score = 0;

  const titleHits = countOccurrences(article.title, query);
  if (titleHits > 0) {
    score += titleHits * TITLE_WEIGHT;
    matchedFields.push("title");
    if (article.title.toLowerCase().startsWith(query.toLowerCase())) {
      score += TITLE_PREFIX_BONUS;
    }
  }

  const summaryHits = countOccurrences(article.sum, query);
  if (summaryHits > 0) {
    score += summaryHits * SUMMARY_WEIGHT;
    matchedFields.push("summary");
  }

  const tagHits = countOccurrences(article.tag ?? "", query);
  if (tagHits > 0) {
    score += tagHits * TAG_WEIGHT;
    matchedFields.push("tag");
  }

  const sectionHits = countOccurrences(sectionNameFor(article), query);
  if (sectionHits > 0) {
    score += sectionHits * SECTION_WEIGHT;
    matchedFields.push("section");
  }

  const bodyHits = countOccurrences(flattenBodyJson(article.bodyJson), query);
  if (bodyHits > 0) {
    score += bodyHits * BODY_WEIGHT;
    matchedFields.push("body");
  }

  if (score === 0) {
    return null;
  }
  return { article, score, matchedFields };
}

/**
 * Run a full-text search across the supplied article pool.
 *
 * @param query — user input. Trimmed before scoring; empty → []
 * @param pool — pre-filtered candidate set (caller decides whether to
 *  filter by `status === "published"`)
 * @param limit — maximum number of hits returned (default 8)
 *
 * Returns hits sorted by score desc, ties by `date` desc.
 */
export function searchArticles(
  query: string,
  pool: Article[],
  limit = 8
): SearchHit[] {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const article of pool) {
    if (seen.has(article.id)) {
      continue;
    }
    seen.add(article.id);
    const hit = scoreArticle(article, q);
    if (hit) {
      hits.push(hit);
    }
  }
  hits.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.article.date.localeCompare(a.article.date);
  });
  return hits.slice(0, limit);
}
