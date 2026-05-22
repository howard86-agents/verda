import type { Article } from "./db";

/**
 * Related-content ranking for the story reader (issue #100).
 *
 * Pure helper: given a current article + a candidate pool, score every
 * candidate by shared section and overlapping tags, rank descending,
 * exclude the current article, and fall back to "latest in section"
 * when nothing in the pool meaningfully overlaps. Stays free of Dexie
 * imports so the ranking logic is exercised directly by the unit
 * tests.
 *
 * Scoring:
 *   - same `section` id → +3 weight (sections are tightly editorial)
 *   - each shared tag from the CSV `tag` field → +1 weight
 *
 * Ties break by `date` descending (latest first), matching the listing
 * sort default.
 */

const SECTION_WEIGHT = 3;

function parseTags(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set();
  }
  const out = new Set<string>();
  for (const piece of raw.split(",")) {
    const t = piece.trim().toLowerCase();
    if (t) {
      out.add(t);
    }
  }
  return out;
}

function scoreFor(target: Article, candidate: Article): number {
  let score = 0;
  if (
    target.section &&
    candidate.section &&
    target.section === candidate.section
  ) {
    score += SECTION_WEIGHT;
  }
  const targetTags = parseTags(target.tag);
  const candidateTags = parseTags(candidate.tag);
  for (const t of candidateTags) {
    if (targetTags.has(t)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Sort candidates by `date` descending (lexicographic on the seeded
 * "May DD" format, ISO-friendly otherwise). Used both for tie-breaking
 * and for the latest-in-section fallback.
 */
function byDateDesc(a: Article, b: Article): number {
  return b.date.localeCompare(a.date);
}

/**
 * Pick the related-content list for a story reader.
 *
 * @param target — the article currently being read
 * @param pool — the candidate pool (typically a page of published items)
 * @param limit — how many entries to return (default 2 to match the existing sidebar)
 *
 * Returns up to `limit` articles, never including the target. When no
 * candidate scores above zero, falls back to the latest pieces in the
 * target's section, then to the latest pieces overall.
 */
export function pickRelated(
  target: Article,
  pool: Article[],
  limit = 2
): Article[] {
  const others = pool.filter((a) => a.id !== target.id);
  const scored = others
    .map((c) => ({ article: c, score: scoreFor(target, c) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return byDateDesc(a.article, b.article);
    })
    .map((s) => s.article);

  if (scored.length >= limit) {
    return scored.slice(0, limit);
  }

  // Fallback. Top up with latest-in-section first, then any remaining
  // pool members. Dedupe so a single article isn't surfaced twice.
  const taken = new Set(scored.map((a) => a.id));
  const sectionFallback = others
    .filter((a) => !taken.has(a.id))
    .filter((a) => target.section && a.section === target.section)
    .sort(byDateDesc);

  const padded = [...scored];
  for (const a of sectionFallback) {
    if (padded.length >= limit) {
      break;
    }
    padded.push(a);
    taken.add(a.id);
  }

  if (padded.length >= limit) {
    return padded.slice(0, limit);
  }

  const generalFallback = others
    .filter((a) => !taken.has(a.id))
    .sort(byDateDesc);
  for (const a of generalFallback) {
    if (padded.length >= limit) {
      break;
    }
    padded.push(a);
  }
  return padded.slice(0, limit);
}
