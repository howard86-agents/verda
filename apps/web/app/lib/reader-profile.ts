import type { Article, GrowthItem, GrowthRule, Member } from "./db";

/**
 * Public reader-profile composer (issue #103).
 *
 * The public profile at `/readers/u/[id]` deliberately exposes a much
 * narrower view of a member than the CMS detail surface: only display
 * name, join date, the member's current growth item (level + plant
 * name), and the list of their *approved* submissions. Email and the
 * private nutrient ledger are not part of the payload — there is no
 * way to surface them through this composer because the output type
 * does not have fields for them.
 *
 * The CMS member detail still composes a richer payload from the same
 * underlying tables; this module is the public-facing slice.
 */

/** A single approved reader-contributed item shown on the profile. */
export interface PublicReaderSubmission {
  date: string;
  id: string;
  /** CSS gradient cover (used as the cover-image fallback). */
  img: string;
  /** `submission` / `repost` / `remix`. */
  kind: string;
  slug: string;
  /** Section / display label, kept for parity with the listing card. */
  tag: string;
  title: string;
}

/** Growth-item summary for a public profile. `null` when the member
 *  has not allocated their first plant yet. */
export interface PublicReaderGrowth {
  /** Localised JP label (e.g. `芽`). */
  jp: string;
  /** 1-based growth level. */
  level: number;
  /** Display plant name (e.g. `Sprout`). */
  name: string;
}

/** Public-facing reader profile payload. */
export interface PublicReaderProfile {
  /** Active growth item summary, or `null` if the member has none. */
  growth: PublicReaderGrowth | null;
  member: {
    id: string;
    /** "Joined March 2024" — an editorial string, never an ISO date. */
    joined: string;
    name: string;
  };
  submissions: PublicReaderSubmission[];
}

/**
 * Reader-contributed kinds used on the public Readers section.
 *
 * `kind` on the article row matches `Social.kind` from the data
 * package, so the same membership check filters reader items in the
 * profile composition.
 */
export const READER_KINDS: ReadonlySet<string> = new Set([
  "submission",
  "repost",
  "remix",
]);

/**
 * Pick the active growth item for a member.
 *
 * Mirrors the CMS member-detail logic: the active item is the newest
 * non-completed growth item by `sequence`, falling back to the most
 * recent item when every plant is finished. Returns `undefined` when
 * the member has no growth items at all.
 */
export function pickActiveGrowthItem(
  items: GrowthItem[]
): GrowthItem | undefined {
  if (items.length === 0) {
    return;
  }
  const sorted = [...items].sort(
    (a, b) => (b.sequence ?? 0) - (a.sequence ?? 0)
  );
  return sorted.find((g) => !g.completedAt) ?? sorted[0];
}

/**
 * Compose the public reader-profile payload.
 *
 * Returns `null` when the member is missing or soft-deleted so the
 * route handler can map to a 404 without leaking the member existing.
 * Approved submissions are the items where:
 *
 *   - `submittedBy === member.id`,
 *   - `kind` is a reader kind (submission / repost / remix), and
 *   - `status === "published"`.
 *
 * Pending or unpublished rows (e.g. submissions awaiting CMS approval)
 * are filtered out so the profile only shows what is publicly
 * browsable, which is the contract the route promises.
 */
export function composePublicReaderProfile(args: {
  articles: Article[];
  growthItems: GrowthItem[];
  growthRules: GrowthRule[];
  member: Member | undefined;
}): PublicReaderProfile | null {
  const { articles, growthItems, growthRules, member } = args;
  if (!member || member.deletedAt) {
    return null;
  }

  const submissions = articles
    .filter(
      (a) =>
        a.submittedBy === member.id &&
        READER_KINDS.has(a.kind) &&
        a.status === "published"
    )
    // Newest first by `date`. Reader items use short relative-day
    // strings (`2d`, `3d`, …) so a lexicographic sort matches the
    // listing's ordering — keep the surfaces consistent.
    .sort((a, b) => b.date.localeCompare(a.date))
    .map<PublicReaderSubmission>((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      date: a.date,
      kind: a.kind,
      img: a.img,
      tag: a.tag,
    }));

  const activeItem = pickActiveGrowthItem(growthItems);
  const growth: PublicReaderGrowth | null = activeItem
    ? buildGrowthSummary(activeItem, growthRules)
    : null;

  return {
    member: {
      id: member.id,
      name: member.name,
      joined: member.joined,
    },
    growth,
    submissions,
  };
}

function buildGrowthSummary(
  item: GrowthItem,
  rules: GrowthRule[]
): PublicReaderGrowth {
  const rule = rules.find((r) => r.level === item.level);
  return {
    level: item.level,
    name: rule?.name ?? "Seed",
    jp: rule?.jp ?? "種",
  };
}
