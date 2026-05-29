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
  // Section-fill stories (issue #96) — ~14 medium pieces (~400-700 words)
  // spread across all five sections so each has multiple published stories,
  // including a second multi-part series ("Walks worth keeping" in
  // Movement). Dates are intentionally earlier than the existing newest
  // (May 18 / s01) so the homepage hero anchor and the topics smoke
  // tests stay stable; bodies live in the seeder so the data package
  // stays focused on metadata.
  {
    id: "s07",
    slug: "one-room-undecorated",
    cat: "Mindful Living",
    section: "mindful-living",
    tag: "morning",
    title: "Why I left one room undecorated",
    jp: "一室、空のまま",
    sum: "On the kindness of an unfinished room — and the empty drawers it taught me to keep elsewhere.",
    img: "linear-gradient(135deg, #ece4d4, #6c685a)",
    imagePrompt:
      "an empty sunlit corner room with one chair, off-white walls, pine floor, soft afternoon light, calm minimal interior, editorial photography",
    imageSeed: 407,
    read: 5,
    date: "May 06",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s08",
    slug: "kettle-on-for-someone-else",
    cat: "Mindful Living",
    section: "mindful-living",
    tag: "morning",
    title: "On putting the kettle on for someone else",
    jp: "お湯を沸かす",
    sum: "A wide-open ritual — four patient minutes of expecting another person, without waiting for them.",
    img: "linear-gradient(135deg, #e8d8c2, #7a5a3c)",
    imagePrompt:
      "a small stovetop kettle whistling on a gas hob, steam rising in soft morning light, two empty teacups beside it on a wooden counter, calm domestic still life",
    imageSeed: 408,
    read: 4,
    date: "May 04",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s09",
    slug: "wholegrains-i-actually-finish",
    cat: "Nutrition",
    section: "nutrition",
    tag: "pantry",
    title: "Wholegrains I actually finish",
    jp: "食べきる穀物",
    sum: "On clearing out the good-intentions shelf and keeping the three bags that always empty.",
    img: "linear-gradient(135deg, #efdcb8, #8a6e3c)",
    imagePrompt:
      "three open glass jars of brown rice rolled oats and pearl barley on a wooden pantry shelf, warm low light, editorial food still life",
    imageSeed: 409,
    read: 4,
    date: "May 02",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s10",
    slug: "three-slow-breakfasts",
    cat: "Nutrition",
    section: "nutrition",
    tag: "recipe",
    title: "Three slow breakfasts in a quiet week",
    jp: "静かな朝食",
    sum: "Rice and egg, oats and grated apple, toast and salt — small repeatable mornings that get me to lunch.",
    img: "linear-gradient(135deg, #f1e4cc, #b27a3a)",
    imagePrompt:
      "an overhead flat lay of three small breakfast bowls — rice with egg, oat porridge with grated apple, toast with butter — on a linen tablecloth, soft daylight, editorial food still life",
    imageSeed: 410,
    read: 5,
    date: "Apr 30",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s11",
    slug: "walking-to-the-post-office",
    cat: "Movement",
    section: "movement",
    tag: "practice",
    title: "Walking to the post office on purpose",
    jp: "寄り道する",
    sum: "On errand-shaped walks — the long route that survives where pure exercise quietly does not.",
    img: "linear-gradient(135deg, #d8d3c2, #4a6058)",
    imagePrompt:
      "a quiet residential street on a spring morning, a small post office at the far corner, cherry trees lining the pavement, soft light, calm urban photograph",
    imageSeed: 411,
    read: 4,
    date: "Apr 28",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s12",
    slug: "rule-of-two-stops",
    cat: "Movement",
    section: "movement",
    series: { name: "Walks worth keeping", ordinal: 1 },
    tag: "practice",
    title: "On the rule of two stops",
    jp: "二駅の散歩",
    sum: "A small default — get off two stops early, walk the rest of the way — and what the unbussed minutes give back.",
    img: "linear-gradient(135deg, #d6dcd0, #4a5e4a)",
    imagePrompt:
      "a city bus pulling away from a quiet stop on a tree-lined avenue, late afternoon light, a single figure walking away from the camera with hands in pockets, calm urban street photograph",
    imageSeed: 412,
    read: 5,
    date: "Apr 26",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s13",
    slug: "weather-argues-with-you",
    cat: "Movement",
    section: "movement",
    series: { name: "Walks worth keeping", ordinal: 2 },
    tag: "practice",
    title: "When the weather argues with you",
    jp: "天気と歩く",
    sum: "Part two of the two-stops rule — the soft arguments the weather makes, and the three minutes that decide the walk.",
    img: "linear-gradient(135deg, #c8d4d4, #3a4a52)",
    imagePrompt:
      "a person in a raincoat walking on a wet pavement under a grey overcast sky, mild drizzle, leaves on the ground, atmospheric calm street photograph",
    imageSeed: 413,
    read: 5,
    date: "Apr 24",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s14",
    slug: "balcony-herbs-real-needs",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "season",
    title: "What balcony herbs really need",
    jp: "バルコニーの草",
    sum: "Sun, water, root — three honest numbers that finally let the basil go and made the mint enormous.",
    img: "linear-gradient(135deg, #d8d3a8, #4a5a32)",
    imagePrompt:
      "a small apartment balcony with three terracotta pots of mint basil and rosemary, late afternoon sun, neutral railing, soft editorial photograph",
    imageSeed: 414,
    read: 5,
    date: "Apr 22",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s15",
    slug: "rain-rearranges-garden",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "season",
    title: "How rain rearranges a small garden",
    jp: "雨と庭",
    sum: "The most thorough gardener I know is the rain — and the small politics of the corner it always shows me.",
    img: "linear-gradient(135deg, #c8d4c2, #3e5a4a)",
    imagePrompt:
      "a small front-yard herb garden the morning after rain, droplets on green leaves, scattered soil, soft overcast light, calm garden still life",
    imageSeed: 415,
    read: 4,
    date: "Apr 20",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s16",
    slug: "overwatering-apologising-plants",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "practice",
    title: "On overwatering, and apologising to plants",
    jp: "水のやりすぎ",
    sum: "I have killed more plants by loving them than by ignoring them — and what the pothos and I worked out.",
    img: "linear-gradient(135deg, #d6d3b8, #5a6a3a)",
    imagePrompt:
      "a healthy potted pothos plant on a wooden desk by a window, trailing leaves, soft morning light, calm domestic still life",
    imageSeed: 416,
    read: 4,
    date: "Apr 18",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s17",
    slug: "toasted-rice-whatever-around",
    cat: "Recipes",
    section: "recipes",
    tag: "recipe",
    title: "Toasted rice with whatever's around",
    jp: "炒り米のごはん",
    sum: "Less a recipe, more a habit — fifteen minutes of patience built around a pan of cold rice.",
    img: "linear-gradient(135deg, #e8c8a0, #a05a2a)",
    imagePrompt:
      "a wide cast iron pan of golden toasted rice with a soft fried egg on top, scallions and sesame seeds, warm kitchen light, editorial food still life",
    imageSeed: 417,
    read: 4,
    date: "Apr 16",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s18",
    slug: "miso-soup-depends-on-day",
    cat: "Recipes",
    section: "recipes",
    tag: "recipe",
    title: "A miso soup that depends on the day",
    jp: "その日の味噌汁",
    sum: "Not one soup but a shape — and the only step I will not bend is taking the pot off the heat.",
    img: "linear-gradient(135deg, #efd5b8, #8a4a2a)",
    imagePrompt:
      "a small ceramic bowl of miso soup with tofu cubes and seaweed, wisp of steam, on a wooden table, warm low light, editorial food still life",
    imageSeed: 418,
    read: 4,
    date: "Apr 14",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s19",
    slug: "simplest-pickle-three-jars",
    cat: "Recipes",
    section: "recipes",
    tag: "pantry",
    title: "The simplest pickle, in three jars",
    jp: "三つの漬物",
    sum: "Half a cup of vinegar, half a cup of water, two teaspoons of sugar, a teaspoon of salt — the whole technique.",
    img: "linear-gradient(135deg, #e0d4b2, #6a8048)",
    imagePrompt:
      "three small clear glass jars of refrigerator pickles — cucumber daikon and mixed vegetables — on a wooden shelf, soft kitchen light, editorial food still life",
    imageSeed: 419,
    read: 5,
    date: "Apr 12",
    author: "Sora M.",
    kind: "brand",
  },
  // Flagship long reads (issue #95) — four editorial anchors, including
  // the 3-part "House with seasons" series. Bodies live in STORY_BODIES
  // as rich Tiptap docs with headings, pull-quotes, and two figures each.
  {
    id: "s21",
    slug: "house-with-seasons-opening-windows",
    cat: "Mindful Living",
    section: "mindful-living",
    series: { name: "House with seasons", ordinal: 1 },
    tag: "seasonal",
    title: "The house with seasons: opening the windows",
    jp: "季節の家・窓を開ける",
    sum: "Part one of a slower-home series — how spring begins with airing the room before improving it.",
    img: "linear-gradient(135deg, #e8dfcf, #5f6d5f)",
    imagePrompt:
      "a calm apartment room in early spring with open windows, linen curtains moving in soft air, a low wooden table with tea and notebooks, muted green view outside",
    imageSeed: 421,
    read: 7,
    date: "Apr 08",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s22",
    slug: "house-with-seasons-summer-counter",
    cat: "Nutrition",
    section: "nutrition",
    series: { name: "House with seasons", ordinal: 2 },
    tag: "seasonal",
    title: "The house with seasons: the summer counter",
    jp: "季節の家・夏の台所",
    sum: "Part two — a kitchen counter arranged for heat, water, fruit, and dinners that do not ask too much.",
    img: "linear-gradient(135deg, #f0dfbf, #b06f3f)",
    imagePrompt:
      "a summer kitchen counter with a clay water pitcher, sliced stone fruit, tomatoes in a shallow bowl, folded towel, warm late afternoon daylight",
    imageSeed: 422,
    read: 7,
    date: "Apr 06",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s23",
    slug: "house-with-seasons-winter-table",
    cat: "Recipes",
    section: "recipes",
    series: { name: "House with seasons", ordinal: 3 },
    tag: "seasonal",
    title: "The house with seasons: the winter table",
    jp: "季節の家・冬の食卓",
    sum: "Part three — soup, lamplight, repair, and the room that gathers everyone close without performing warmth.",
    img: "linear-gradient(135deg, #eadac8, #5a463f)",
    imagePrompt:
      "a winter dining table at dusk with a pot of soup, small bowls, amber lamp light, wool blanket on a chair, quiet warm domestic scene",
    imageSeed: 423,
    read: 8,
    date: "Apr 04",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s24",
    slug: "compost-notes-small-balcony",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "practice",
    title: "Compost notes from a small balcony",
    jp: "小さなベランダの堆肥ノート",
    sum: "A long look at scraps, soil, smell, and the patience of making waste useful at apartment scale.",
    img: "linear-gradient(135deg, #d9d2a8, #4f6339)",
    imagePrompt:
      "a small balcony compost bin beside terracotta herb pots, dried leaves, citrus peels in a bowl, city apartment railing, soft overcast morning",
    imageSeed: 424,
    read: 8,
    date: "Apr 02",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s20",
    slug: "rice-porridge-bad-day",
    cat: "Recipes",
    section: "recipes",
    tag: "recipe",
    title: "Rice porridge when the day asked too much",
    jp: "疲れた日のお粥",
    sum: "A small bag of rice and ten times the water — a quiet bad-day shelf the kitchen learned to keep.",
    img: "linear-gradient(135deg, #ece4d0, #8a6c40)",
    imagePrompt:
      "a small ceramic bowl of plain rice porridge with a soft-boiled egg on top, ginger and scallion, soft kitchen light, calm food still life",
    imageSeed: 420,
    read: 5,
    date: "Apr 10",
    author: "Lin K.",
    kind: "brand",
  },

  // Editorial expansion — ten additional evergreen pieces so the public
  // library feels like an active magazine rather than a sparse demo.
  {
    id: "s25",
    slug: "market-list-for-a-rainy-week",
    cat: "Nutrition",
    section: "nutrition",
    tag: "pantry",
    title: "A market list for a rainy week",
    jp: "雨の週の買い物リスト",
    sum: "Seven flexible ingredients that can become soup, toast, bowls, or a quiet dinner without another errand.",
    img: "linear-gradient(135deg, #ead8b8, #6f6a42)",
    imagePrompt:
      "a folded handwritten grocery list beside mushrooms greens citrus and a paper bag on a kitchen table, rainy window light, editorial still life",
    imageSeed: 425,
    read: 6,
    date: "Mar 30",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s26",
    slug: "desk-reset-before-afternoon",
    cat: "Mindful Living",
    section: "mindful-living",
    tag: "journal",
    title: "The five-minute desk reset before afternoon",
    jp: "午後前の机リセット",
    sum: "A small practice for clearing the work surface without pretending the whole life is organized.",
    img: "linear-gradient(135deg, #e4dfd2, #5f6260)",
    imagePrompt:
      "a tidy wooden desk with one notebook, a ceramic cup, a small plant, afternoon light through linen curtains, calm editorial photograph",
    imageSeed: 426,
    read: 5,
    date: "Mar 28",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s27",
    slug: "stretches-for-small-kitchens",
    cat: "Movement",
    section: "movement",
    tag: "practice",
    title: "Stretches for small kitchens",
    jp: "小さな台所のストレッチ",
    sum: "Three practical movements that fit between the kettle, the sink, and the minute before dinner.",
    img: "linear-gradient(135deg, #d8ddd2, #53624f)",
    imagePrompt:
      "a compact apartment kitchen with morning light, a person stretching one arm against the counter, calm domestic editorial photograph",
    imageSeed: 427,
    read: 4,
    date: "Mar 26",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s28",
    slug: "seed-tray-on-the-windowsill",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "season",
    title: "A seed tray on the windowsill",
    jp: "窓辺の種まき",
    sum: "How ten cells of soil made spring visible before anything outside agreed to bloom.",
    img: "linear-gradient(135deg, #d7d8b8, #4e6840)",
    imagePrompt:
      "a small seed tray with tiny green sprouts on a bright apartment windowsill, handwritten labels, soft spring light, macro editorial photograph",
    imageSeed: 428,
    read: 6,
    date: "Mar 24",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s29",
    slug: "brothy-noodles-after-market",
    cat: "Recipes",
    section: "recipes",
    tag: "recipe",
    title: "Brothy noodles after the market",
    jp: "市場帰りの汁麺",
    sum: "A flexible bowl built from greens, broth, noodles, and the one thing you bought because it smelled good.",
    img: "linear-gradient(135deg, #ecd0b2, #7b3f2f)",
    imagePrompt:
      "a steaming bowl of clear brothy noodles with market greens mushrooms and herbs on a wooden table, warm kitchen light, editorial food photograph",
    imageSeed: 429,
    read: 5,
    date: "Mar 22",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s30",
    slug: "library-card-as-a-seasonal-tool",
    cat: "Mindful Living",
    section: "mindful-living",
    tag: "journal",
    title: "The library card as a seasonal tool",
    jp: "季節の図書カード",
    sum: "Borrowing less, returning sooner, and letting the public shelf choose part of the month.",
    img: "linear-gradient(135deg, #dcd8cc, #4f4a42)",
    imagePrompt:
      "a library card, three borrowed books, and a receipt on a quiet reading table near a window, soft natural light, editorial still life",
    imageSeed: 430,
    read: 6,
    date: "Mar 20",
    author: "Lin K.",
    kind: "brand",
  },
  {
    id: "s31",
    slug: "stairs-instead-of-a-workout",
    cat: "Movement",
    section: "movement",
    tag: "practice",
    title: "Taking the stairs instead of calling it a workout",
    jp: "運動と呼ばない階段",
    sum: "On choosing useful exertion — four floors, one bag of groceries, and no performance metrics.",
    img: "linear-gradient(135deg, #d4d7d0, #4b5658)",
    imagePrompt:
      "an old apartment stairwell with soft daylight, grocery bag on a landing, quiet urban domestic atmosphere, editorial photograph",
    imageSeed: 431,
    read: 4,
    date: "Mar 18",
    author: "J. Park",
    kind: "brand",
  },
  {
    id: "s32",
    slug: "companion-planting-for-impatient-people",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "practice",
    title: "Companion planting for impatient people",
    jp: "せっかちな人の混植",
    sum: "A practical balcony map: basil with tomatoes, flowers with greens, and enough distance to prevent drama.",
    img: "linear-gradient(135deg, #d5d7aa, #466936)",
    imagePrompt:
      "a balcony planter with tomatoes basil marigolds and leafy greens growing together, handwritten plant markers, bright morning light, editorial garden photograph",
    imageSeed: 432,
    read: 6,
    date: "Mar 16",
    author: "A. Chen",
    kind: "brand",
  },
  {
    id: "s33",
    slug: "beans-that-wait-in-the-freezer",
    cat: "Recipes",
    section: "recipes",
    tag: "pantry",
    title: "Beans that wait in the freezer",
    jp: "冷凍庫で待つ豆",
    sum: "One pot of beans, four future dinners, and the relief of finding care already cooked.",
    img: "linear-gradient(135deg, #ead6bb, #74503a)",
    imagePrompt:
      "small freezer containers of cooked beans labeled by hand beside a bowl of brothy beans with herbs, warm kitchen light, editorial food still life",
    imageSeed: 433,
    read: 5,
    date: "Mar 14",
    author: "Sora M.",
    kind: "brand",
  },
  {
    id: "s34",
    slug: "evening-light-in-the-shared-courtyard",
    cat: "Earth & Garden",
    section: "earth-garden",
    tag: "season",
    title: "Evening light in the shared courtyard",
    jp: "中庭の夕方の光",
    sum: "What a building learns when neighbors water plants at the same hour without arranging to meet.",
    img: "linear-gradient(135deg, #d8d0b2, #425f45)",
    imagePrompt:
      "a small shared apartment courtyard at golden hour with potted plants, watering cans, bicycles, and warm windows, calm editorial photograph",
    imageSeed: 434,
    read: 7,
    date: "Mar 12",
    author: "A. Chen",
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
  // Reader-section fill (issue #97) — 12 net-new reader items so the
  // /readers listing and homepage sidebar look populated on first load.
  // Distribution (15 total): 6 submissions, 5 reposts, 4 remixes. Each
  // item's `submittedBy` maps to a member id seeded by the web seeder
  // (see apps/web/app/lib/seed.ts); reposts and remixes carry the
  // attribution fields the public reader detail surfaces.
  {
    id: "r04",
    slug: "small-bento-long-train",
    kind: "submission",
    src: "@sora.bento",
    submittedBy: "m_5102",
    title: "A small bento on a long train",
    tag: "reader",
    img: "linear-gradient(135deg, #f1dec0, #a07a3a)",
    imagePrompt:
      "a neatly packed wooden bento box of small portions of rice tamagoyaki and pickled vegetables on a train tray table, soft window light, calm food still life",
    imageSeed: 504,
    date: "6d",
  },
  {
    id: "r05",
    slug: "three-pickles-before-may",
    kind: "submission",
    src: "@daikon.diary",
    submittedBy: "m_8201",
    title: "Three pickles before May",
    tag: "reader",
    img: "linear-gradient(135deg, #e8e0c8, #6c8048)",
    imagePrompt:
      "three small clear glass jars of refrigerator pickles on a sunny windowsill, soft daylight, calm domestic still life",
    imageSeed: 505,
    date: "7d",
  },
  {
    id: "r06",
    slug: "slow-water-from-the-tap",
    kind: "submission",
    src: "@paper.fold",
    submittedBy: "m_8334",
    title: "Slow water from the tap, on Sunday",
    tag: "reader",
    img: "linear-gradient(135deg, #d8dcd8, #4a6068)",
    imagePrompt:
      "a slow stream of water from a kitchen tap into a small ceramic bowl, soft window light, calm minimal photograph",
    imageSeed: 506,
    date: "8d",
  },
  {
    id: "r07",
    slug: "what-grandmother-does-with-stale-rice",
    kind: "submission",
    src: "@mochi.kitchen",
    submittedBy: "m_6033",
    title: "What my grandmother does with stale rice",
    tag: "reader",
    img: "linear-gradient(135deg, #efe1c0, #8a5a2a)",
    imagePrompt:
      "a small clay pot of toasted rice porridge with scallions and sesame on a wooden table, soft kitchen light, calm food still life",
    imageSeed: 507,
    date: "9d",
  },
  {
    id: "r08",
    slug: "unanswered-note-pinned-to-the-door",
    kind: "submission",
    src: "@still.life.tw",
    submittedBy: "m_8651",
    title: "An unanswered note pinned to the door",
    tag: "reader",
    img: "linear-gradient(135deg, #ece4d2, #6a5a3a)",
    imagePrompt:
      "a small handwritten note pinned to a wooden apartment door with a thumbtack, soft hallway light, calm domestic still life",
    imageSeed: 508,
    date: "10d",
  },
  {
    id: "r09",
    slug: "handwashed-tea-towel-in-summer",
    kind: "repost",
    src: "Instagram · @hana.tea",
    submittedBy: "m_7188",
    title: "A handwashed tea towel, photographed in summer",
    tag: "spotted",
    img: "linear-gradient(135deg, #e0e6e2, #5a6a62)",
    imagePrompt:
      "a folded linen tea towel hanging on a wooden rack by a sunlit window, soft summer light, calm domestic still life",
    imageSeed: 509,
    date: "11d",
  },
  {
    id: "r10",
    slug: "lunch-at-the-chess-corner",
    kind: "repost",
    src: "Twitter · @kenji.markets",
    submittedBy: "m_8492",
    title: "Lunch at the chess corner",
    tag: "spotted",
    img: "linear-gradient(135deg, #e6d8b8, #6a4a2a)",
    imagePrompt:
      "an outdoor street scene with two older men playing chess at a small table beside a noodle stand, late afternoon light, candid urban photograph",
    imageSeed: 510,
    date: "12d",
  },
  {
    id: "r11",
    slug: "readers-plant-three-years-on",
    kind: "repost",
    src: "Instagram · @small.balcony",
    submittedBy: "m_8728",
    title: "A reader's plant, three years on",
    tag: "spotted",
    img: "linear-gradient(135deg, #d6dcc8, #3a5a3a)",
    imagePrompt:
      "a healthy potted pothos plant on a small apartment balcony beside a wicker chair, soft afternoon sun, calm domestic still life",
    imageSeed: 511,
    date: "13d",
  },
  {
    id: "r12",
    slug: "late-night-ramen-single-egg",
    kind: "repost",
    src: "Instagram · @noodle.house",
    submittedBy: "m_8910",
    title: "Late-night ramen with a single egg",
    tag: "spotted",
    img: "linear-gradient(135deg, #efd6c0, #8a3a2a)",
    imagePrompt:
      "a steaming bowl of shoyu ramen with a soft-boiled egg and scallion on a wooden counter at a small noodle shop, warm low light, candid food photograph",
    imageSeed: 512,
    date: "14d",
  },
  {
    id: "r13",
    slug: "four-readers-same-thunderstorm",
    kind: "remix",
    src: "Verda × @yuki.walks",
    submittedBy: "m_8849",
    title: "Four readers on the same thunderstorm",
    tag: "remix",
    img: "linear-gradient(135deg, #c8d2dc, #2a3a52)",
    imagePrompt:
      "rainwater pooling on city pavement during a thunderstorm at dusk, distant streetlight glow, atmospheric calm urban photograph",
    imageSeed: 513,
    date: "15d",
  },
  {
    id: "r14",
    slug: "six-pickles-six-handwritings",
    kind: "remix",
    src: "Verda × @aiko.studio",
    submittedBy: "m_8201",
    title: "Six pickles, in six handwritings",
    tag: "remix",
    img: "linear-gradient(135deg, #e0d4ba, #6a4a2a)",
    imagePrompt:
      "a flat lay of six handwritten recipe cards beside small jars of pickles on a wooden table, soft daylight, editorial food photograph",
    imageSeed: 514,
    date: "16d",
  },
  {
    id: "r15",
    slug: "what-the-kettle-taught-us",
    kind: "remix",
    src: "Verda × @ren.notes",
    submittedBy: "m_8334",
    title: "What the kettle taught us — a community piece",
    tag: "remix",
    img: "linear-gradient(135deg, #e6d8c8, #6c5a4a)",
    imagePrompt:
      "an overhead flat lay of three different kettles on a wooden counter beside small ceramic teacups, soft daylight, calm editorial photograph",
    imageSeed: 515,
    date: "17d",
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
export type BadgeId =
  | "first_read"
  | "reader_10"
  | "reader_25"
  | "first_bloom"
  | "first_submission"
  | "commenter";

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
  // Community badges (issue #105). Awarded automatically when the
  // member's first approved submission is published or their first
  // comment is posted; the runtime predicate lives in
  // `apps/web/app/lib/badges.ts`. The catalog stays free of Dexie
  // imports so it can ship from the data package.
  {
    id: "first_submission",
    name: "First submission",
    jp: "初投稿",
    icon: "✍️",
    description:
      "A reader submission was approved and published — your voice on the page.",
    criteria: "Have one submission approved",
  },
  {
    id: "commenter",
    name: "Commenter",
    jp: "コメンター",
    icon: "💬",
    description: "Posted a comment on a story — joined the conversation.",
    criteria: "Post one comment",
  },
];
