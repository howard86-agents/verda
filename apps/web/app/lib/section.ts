import { SECTIONS } from "@verda/data";
import type { ArticleSeries } from "./db";

/**
 * Section helpers for the public surfaces (issue #87).
 *
 * The content model stores `section` as a stable id (e.g. `mindful-living`)
 * while keeping the older free-form `cat` string alongside for back-compat
 * with the existing CMS filter / listing API. Cards and the story reader
 * call `sectionLabel()` to surface the canonical display name when present
 * and fall back to `cat` so unmigrated rows keep rendering.
 */

interface SectionAware {
  cat?: string;
  section?: string;
}

/**
 * Resolve the display name for an article's section.
 *
 * Prefers the canonical `section` id mapped through `SECTIONS`. Falls back
 * to the legacy `cat` string when no canonical match exists or `section`
 * is unset, mirroring the additive-migration contract: existing data must
 * round-trip without surface regressions.
 */
export function sectionLabel(article: SectionAware): string {
  if (article.section) {
    const match = SECTIONS.find((s) => s.id === article.section);
    if (match) {
      return match.name;
    }
  }
  return article.cat ?? "";
}

/**
 * Render a part-indicator string for a series-grouped story.
 *
 * Returns the user-facing label `Part 0N · <Name>` (e.g.
 * `Part 02 · Quiet rituals`) when the article belongs to a series, or
 * `null` for standalone stories. Two-digit padding mirrors the existing
 * editorial style used for issue numbers and growth-item sequences.
 */
export function seriesPartLabel(
  series: ArticleSeries | undefined
): string | null {
  if (!series) {
    return null;
  }
  const padded = String(series.ordinal).padStart(2, "0");
  return `Part ${padded} · ${series.name}`;
}
