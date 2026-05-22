// Verda · Tokyo Press — Multimedia Story Center sample data.
// Static design data; no backend wiring in this pass.

export type StoryKind = "brand";

/** Cover-image categories — the public/img/<kind>/ folders the CLI writes. */
export type ImageKind = "stories" | "social";

/**
 * The canonical content sections (issue #87).
 *
 * `Section` is a first-class content-model concept that replaces the older
 * free-form `cat` string for grouping stories. The five values are the
 * existing brand categories — Mindful Living, Nutrition, Movement, Earth &
 * Garden, and Recipes — promoted to a typed taxonomy so listing filters,
 * section-browse pages (#98), search (#99), and related-content (#100)
 * can rely on a stable, queryable set rather than a free-form label.
 */
export interface Section {
  /** Stable id used as the storage key (e.g. `mindful-living`). */
  id: string;
  /** Display name shown in the UI (e.g. `Mindful Living`). */
  name: string;
}

/**
 * Multi-part-story grouping (issue #87).
 *
 * A story belongs to a series via `{ name, ordinal }` (e.g.
 * `{ name: "Quiet rituals", ordinal: 1 }`). The renderer uses `ordinal`
 * to surface a `Part 01 · 02` indicator on the public reader and on the
 * story card. Series is purely additive — most stories carry no series.
 */
export interface SeriesRef {
  /** Display name of the series (e.g. `Quiet rituals`). */
  name: string;
  /** 1-based part number within the series. */
  ordinal: number;
}

/**
 * The five canonical sections seeded into the content store.
 *
 * Order is editorial (Mindful Living first); the seeder iterates this list
 * to prime the `sections` table on first boot, and the CMS editor + the
 * public listing render selects from these ids.
 */
export const SECTIONS: Section[] = [
  { id: "mindful-living", name: "Mindful Living" },
  { id: "nutrition", name: "Nutrition" },
  { id: "movement", name: "Movement" },
  { id: "earth-garden", name: "Earth & Garden" },
  { id: "recipes", name: "Recipes" },
];

/**
 * Convenience: the editorial section names. Used by the listing's section
 * filter buttons; mirrors the `name` field of `SECTIONS` in display order.
 */
export const SECTION_NAMES: string[] = SECTIONS.map((s) => s.name);

/**
 * Map a free-form `cat` label to a canonical section id. Returns
 * `undefined` if no canonical section matches; callers fall back to
 * the legacy `cat` string in that case (additive migration, issue #87).
 */
export function sectionIdFromCat(cat: string | undefined): string | undefined {
  if (!cat) {
    return;
  }
  const target = cat.trim().toLowerCase();
  return SECTIONS.find((s) => s.name.toLowerCase() === target)?.id;
}

export interface Story {
  author: string;
  cat: string;
  date: string;
  id: string;
  /** Prompt for the apps/cli cover generator. */
  imagePrompt: string;
  imageSeed: number;
  /** CSS gradient used as the cover backdrop / fallback. */
  img: string;
  jp: string;
  kind: StoryKind;
  /** Reading time in minutes. */
  read: number;
  /**
   * Stable id of the section this story belongs to (issue #87). Mirrors a
   * row in `SECTIONS`; `cat` is kept alongside for back-compat with the
   * existing CMS filter and listing API while the content model migrates.
   */
  section: string;
  /** Optional multi-part-series grouping (issue #87). */
  series?: SeriesRef;
  slug: string;
  /**
   * Optional reference to the member who submitted this content (issue #87).
   * Brand stories leave this unset; reader-contributed items (kind=social)
   * carry a real member id so the public reader profile (#103) and the
   * community reward pipeline (#104) can attribute them.
   */
  submittedBy?: string;
  sum: string;
  tag: string;
  title: string;
}

export const STORIES: Story[] = [
  {
    id: "s01",
    slug: "quiet-rituals-slower-morning",
    cat: "Mindful Living",
    section: "mindful-living",
    series: { name: "Quiet rituals", ordinal: 1 },
    tag: "morning",
    title: "The quiet rituals that shape a slower morning",
    jp: "静かな朝の儀式",
    sum: "On choosing one small thing — and letting it stay small.",
    img: "linear-gradient(135deg, #d6d3c8, #4a4a45)",
    imagePrompt:
      "a quiet sunlit breakfast nook at dawn, a single ceramic cup of tea on a worn wooden table, soft folded linen, calm minimal still life",
    imageSeed: 401,
    read: 6,
    date: "May 18",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s02",
    slug: "spring-bowl-five-colors",
    cat: "Nutrition",
    section: "nutrition",
    tag: "recipe",
    title: "A spring bowl, in five colors",
    jp: "春の五色丼",
    sum: "How a handful of soaked grains became a habit.",
    img: "linear-gradient(135deg, #f0e1c3, #c2603a)",
    imagePrompt:
      "an overhead flat lay of a colorful grain bowl with vegetables in five colors, rustic ceramic bowl, soft daylight",
    imageSeed: 402,
    read: 4,
    date: "May 16",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s03",
    slug: "reading-the-soil",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "season",
    title: "Reading the soil — what your basil is telling you",
    jp: "土を読む",
    sum: "Curling, yellow tips, and the patience of clay.",
    img: "linear-gradient(135deg, #d7c8a0, #5a5a3a)",
    imagePrompt:
      "close-up of a potted basil plant in a terracotta pot on a windowsill, rich dark soil, soft natural light",
    imageSeed: 403,
    read: 8,
    date: "May 14",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s04",
    slug: "a-walk-after-dinner",
    cat: "Movement",
    section: "movement",
    tag: "practice",
    title: "A walk, after dinner, in any weather",
    jp: "夕食後の一歩",
    sum: "The smallest practice that survived the year.",
    img: "linear-gradient(135deg, #e5cdbf, #c8261d)",
    imagePrompt:
      "a tree-lined path at dusk after rain, soft golden streetlight, a lone figure walking away, calm atmospheric mood",
    imageSeed: 404,
    read: 3,
    date: "May 12",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s05",
    slug: "paper-journal-week-19",
    cat: "Mindful Living",
    section: "mindful-living",
    series: { name: "Quiet rituals", ordinal: 2 },
    tag: "journal",
    title: "Notes from a paper journal, week 19",
    jp: "手帳の余白",
    sum: "What I kept, what I crossed out, what I felt at 6am.",
    img: "linear-gradient(135deg, #d8d8d0, #6a6a62)",
    imagePrompt:
      "an open handwritten paper journal with a fountain pen resting on a wooden desk, soft morning light, intimate still life",
    imageSeed: 405,
    read: 5,
    date: "May 10",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s06",
    slug: "six-pantry-items",
    cat: "Nutrition",
    section: "nutrition",
    tag: "pantry",
    title: "Six pantry items I now refuse to be without",
    jp: "六つの常備品",
    sum: "On building flavor without buying more.",
    img: "linear-gradient(135deg, #e6d3b8, #8a6c40)",
    imagePrompt:
      "a tidy pantry shelf of glass jars filled with grains and spices, warm kitchen light, editorial food still life",
    imageSeed: 406,
    read: 6,
    date: "May 08",
    author: "Sora M.",
    kind: "brand",
  },
];

export type SocialKind = "submission" | "repost" | "remix";

export interface Social {
  date: string;
  id: string;
  imagePrompt: string;
  imageSeed: number;
  img: string;
  kind: SocialKind;
  slug: string;
  src: string;
  /**
   * Optional id of the member who submitted this reader item (issue #87).
   * Used by reader profiles (#103) and the community reward pipeline (#104)
   * to attribute submissions/reposts/remixes back to a real member.
   */
  submittedBy?: string;
  tag: string;
  title: string;
}

export const SOCIAL: Social[] = [
  {
    id: "r01",
    slug: "turmeric-porridge",
    kind: "submission",
    src: "@maya.cooks",
    submittedBy: "m_5102",
    title: "Reader recipe: turmeric porridge, my mother's way",
    tag: "reader",
    img: "linear-gradient(135deg, #f3d6a8, #c87a3a)",
    imagePrompt:
      "a warm bowl of golden turmeric porridge topped with seeds and herbs, cozy home kitchen, soft light",
    imageSeed: 501,
    date: "2d",
  },
  {
    id: "r02",
    slug: "pop-up-garden",
    kind: "repost",
    src: "Instagram · @leaf",
    submittedBy: "m_6033",
    title: "A pop-up garden in the city, behind a stationery shop",
    tag: "spotted",
    img: "linear-gradient(135deg, #c8d8c4, #4a6b48)",
    imagePrompt:
      "a small lush pop-up garden behind a stationery shop in the city, potted green plants, charming urban corner",
    imageSeed: 502,
    date: "3d",
  },
  {
    id: "r03",
    slug: "field-notes-remix",
    kind: "remix",
    src: "Verda × @studioh",
    submittedBy: "m_7188",
    title: "Field notes — a remix of three reader essays",
    tag: "remix",
    img: "linear-gradient(135deg, #e9c4d0, #9a4a68)",
    imagePrompt:
      "a collage of handwritten field notes and pressed leaves on textured paper, soft daylight, editorial flat lay",
    imageSeed: 503,
    date: "5d",
  },
];

export const CATEGORIES = [
  "All",
  "Mindful Living",
  "Nutrition",
  "Movement",
  "Earth & Garden",
  "Recipes",
];

export const COLLECTED = ["s01", "s03", "s05"];

export interface GrowthLevel {
  current?: boolean;
  done: boolean;
  jp: string;
  n: number;
  name: string;
  threshold: number;
}

export const GROWTH_LEVELS: GrowthLevel[] = [
  { n: 1, name: "Seed", jp: "種", threshold: 0, done: true },
  { n: 2, name: "Sprout", jp: "芽", threshold: 50, done: true, current: true },
  { n: 3, name: "Bloom", jp: "花", threshold: 150, done: false },
  { n: 4, name: "Fully grown", jp: "結実", threshold: 300, done: false },
];

export interface LedgerEntry {
  amt: string;
  when: string;
  why: string;
}

export const LEDGER: LedgerEntry[] = [
  { amt: "+10", why: "Read · Letters to a slower year", when: "today · 14:08" },
  { amt: "+5", why: "Daily check-in", when: "today · 09:02" },
  { amt: "+2", why: "Saved · Reading the soil", when: "yesterday" },
  { amt: "+10", why: "Read · A spring bowl in 5 colors", when: "May 16" },
  { amt: "+5", why: "Daily check-in", when: "May 16" },
];

/** Current growth state, shared by the Home teaser, Grow page and Collection. */
export const GROWTH = {
  level: 2,
  nutrients: 87,
  nextThreshold: 150,
  nextName: "Bloom",
};

/** The logged-in member (Collection profile + CMS member admin sample). */
export const MEMBER = {
  initial: "M",
  name: "Mira Tanaka",
  jp: "田中ミラ",
  memberId: "m_4421",
  joined: "Joined March 2024",
  email: "mira.t@example.com",
  level: 2,
  nutrients: 87,
  read: 14,
  saved: 3,
  redeemed: 0,
};

/**
 * Badge catalog (issue #93).
 *
 * Each badge has a stable id, a display name, a JP label, an icon glyph,
 * and a `criteria` description for the locked-state UI. The runtime
 * predicate that decides whether a badge is earned lives in
 * `apps/web/app/lib/badges.ts` so the catalog stays free of Dexie
 * imports and can be exported from this data package.
 */
export type BadgeId = "first_read" | "reader_10" | "reader_25" | "first_bloom";

export interface Badge {
  /** Short marketing-style criteria copy for the locked card. */
  criteria: string;
  /** Editorial description shown on the earned card. */
  description: string;
  /** Single-glyph icon. Themed to match the site's plant/leaf voice. */
  icon: string;
  id: BadgeId;
  jp: string;
  name: string;
}

export const BADGE_CATALOG: Badge[] = [
  {
    id: "first_read",
    name: "First read",
    jp: "初読",
    icon: "📖",
    description: "Finished your first Verda story.",
    criteria: "Finish one story",
  },
  {
    id: "reader_10",
    name: "Steady reader",
    jp: "読み手",
    icon: "🌿",
    description: "Ten stories read — you've found a rhythm.",
    criteria: "Finish 10 stories",
  },
  {
    id: "reader_25",
    name: "Devoted reader",
    jp: "愛読者",
    icon: "🌳",
    description: "Twenty-five stories read — quiet, consistent practice.",
    criteria: "Finish 25 stories",
  },
  {
    id: "first_bloom",
    name: "First bloom",
    jp: "初開花",
    icon: "🌸",
    description: "A seedling reached the Bloom level for the first time.",
    criteria: "Reach Bloom (Lv 03) on any plant",
  },
];
