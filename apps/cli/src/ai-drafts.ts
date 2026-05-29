import { SECTIONS } from "@verda/data";

export interface DraftArgs {
  count: number;
  dryRun: boolean;
  referenceTitle?: string;
  referenceUrl?: string;
  section?: string;
  status: "draft";
  theme?: string;
}

export interface DraftBuildInput {
  generatedAt?: Date;
  index: number;
  referenceTitle?: string;
  referenceUrl?: string;
  sectionId: string;
  theme?: string;
}

export interface DraftArticle {
  author: string;
  bodyJson: string;
  cat: string;
  date: string;
  imagePrompt: string;
  imageSeed: number;
  img: string;
  jp: string;
  kind: "brand";
  license: string;
  read: number;
  section: string;
  slug: string;
  sourceUrl?: string;
  status: "draft";
  sum: string;
  tag: string;
  title: string;
}

const DEFAULT_COUNT = 3;
const MAX_COUNT = 10;
const MAX_REFERENCE_TITLE_LENGTH = 140;
const MAX_THEME_LENGTH = 80;
const AI_DRAFT_LICENSE =
  "AI-generated draft; editorial review and fact-check required before publishing.";

const SECTION_TOPICS: Record<
  string,
  {
    angle: string;
    cat: string;
    image: string;
    jp: string;
    tag: string;
    title: string;
  }
> = {
  "mindful-living": {
    angle: "daily attention, rest, and small rituals",
    cat: "Mindful Living",
    image:
      "a calm apartment corner with paper notes, ceramic tea, linen curtains, warm morning light",
    jp: "静かな生活実験",
    tag: "rituals",
    title: "The small civic ritual hidden inside an ordinary morning",
  },
  nutrition: {
    angle: "food systems, seasonal cooking, and practical nourishment",
    cat: "Nutrition",
    image:
      "seasonal vegetables on a kitchen table beside handwritten notes, documentary food photography",
    jp: "食卓の調査ノート",
    tag: "food-systems",
    title: "What a weekly market basket reveals about eating well",
  },
  movement: {
    angle: "walkable cities, body habits, and accessible movement",
    cat: "Movement",
    image:
      "people walking through a tree-lined neighborhood after rain, gentle editorial documentary mood",
    jp: "歩く都市の記録",
    tag: "walking",
    title: "A slow walk through the infrastructure of everyday health",
  },
  "earth-garden": {
    angle: "urban ecology, climate adaptation, and home-scale stewardship",
    cat: "Earth & Garden",
    image:
      "balcony planters, city rooftops, soil, leaves, and rainwater containers in soft daylight",
    jp: "都市の小さな生態系",
    tag: "urban-ecology",
    title: "Reading the city through soil, shade, and small habitats",
  },
  recipes: {
    angle:
      "recipe as reported narrative, ingredient history, and kitchen practice",
    cat: "Recipes",
    image:
      "a simple seasonal dish in a ceramic bowl with prep notes and natural kitchen light",
    jp: "台所からの物語",
    tag: "recipe",
    title: "A recipe that begins before the pan gets warm",
  },
};

export function parseDraftArgs(argv: string[]): DraftArgs {
  const count = readNumberFlag(argv, "--count", DEFAULT_COUNT);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`--count must be an integer between 1 and ${MAX_COUNT}`);
  }

  const section = readStringFlag(argv, "--section");
  if (section && !SECTION_TOPICS[section]) {
    throw new Error(
      `--section must be one of: ${Object.keys(SECTION_TOPICS).join(", ")}`
    );
  }

  const referenceUrl = readStringFlag(argv, "--reference-url");
  if (referenceUrl) {
    validateHttpUrl(referenceUrl, "--reference-url");
  }

  const referenceTitle = readStringFlag(argv, "--reference-title");
  if (referenceTitle && referenceTitle.length > MAX_REFERENCE_TITLE_LENGTH) {
    throw new Error(
      `--reference-title must be ${MAX_REFERENCE_TITLE_LENGTH} characters or fewer`
    );
  }

  const theme = readStringFlag(argv, "--theme");
  if (theme && theme.length > MAX_THEME_LENGTH) {
    throw new Error(`--theme must be ${MAX_THEME_LENGTH} characters or fewer`);
  }

  return {
    count,
    dryRun: argv.includes("--dry-run"),
    referenceTitle,
    referenceUrl,
    section,
    status: "draft",
    theme,
  };
}

function validateHttpUrl(value: string, flag: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${flag} must be a valid URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${flag} must use http or https`);
  }
}

function readStringFlag(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx < 0) {
    return;
  }
  const value = argv[idx + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function readNumberFlag(
  argv: string[],
  flag: string,
  fallback: number
): number {
  const raw = readStringFlag(argv, flag);
  return raw ? Number(raw) : fallback;
}

export function sectionsForRun(args: DraftArgs): string[] {
  if (args.section) {
    return Array.from({ length: args.count }, () => args.section as string);
  }
  return Array.from(
    { length: args.count },
    (_, index) => sectionIds()[index % sectionIds().length]
  );
}

function sectionIds(): string[] {
  return SECTIONS.map((section) => section.id).filter(
    (id) => SECTION_TOPICS[id]
  );
}

export function buildDraft(input: DraftBuildInput): DraftArticle {
  const generatedAt = input.generatedAt ?? new Date();
  const topic = SECTION_TOPICS[input.sectionId];
  if (!topic) {
    throw new Error(`Unknown section: ${input.sectionId}`);
  }
  const theme = input.theme?.trim() || topic.angle;
  const referenceContext = input.referenceTitle
    ? "A public editorial reference was used only as a topic signal; the draft below uses original reporting-style framing and examples."
    : "The draft uses original reporting-style framing and examples rather than copied source material.";
  const title = titleFor(topic.title, theme, input.index);
  const slugSubject = input.theme ? `${title}-${theme}` : title;
  const slug = `ai-${formatDateSlug(generatedAt)}-${slugifyTitle(slugSubject)}-${input.index + 1}`;
  const paragraphs = [
    `${referenceContext} Verda approaches ${theme} through the lens of practical, reader-centered daily life.`,
    "The piece opens with a small scene, then widens into an explainer: what changed, why it matters, and what a reader can try without turning care into another obligation.",
    "Editors should verify any factual claims, add local sourcing where needed, and replace this paragraph with reported details before publishing.",
    "The recommended service box closes with three grounded actions: observe one habit, adjust one environmental cue, and document what changes over the next week.",
  ];

  return {
    author: "Verda AI Desk",
    bodyJson: serializeTipTapBody(paragraphs),
    cat: topic.cat,
    date: formatDisplayDate(generatedAt),
    imagePrompt: `${topic.image}, inspired by ${theme}, no text, no logo, no watermark`,
    imageSeed: 9000 + input.index,
    img: gradientFor(input.index),
    jp: topic.jp,
    kind: "brand",
    license: AI_DRAFT_LICENSE,
    read: 6 + (input.index % 3),
    section: input.sectionId,
    slug,
    sourceUrl: input.referenceUrl,
    status: "draft",
    sum: `An AI-generated editorial draft exploring ${theme}; review and fact-check before publishing.`,
    tag: topic.tag,
    title,
  };
}

function titleFor(base: string, theme: string, index: number): string {
  if (index === 0) {
    return base;
  }
  const suffixes = [
    "A field guide for the next quiet change",
    "The practical questions worth asking first",
    "What readers can observe before they act",
  ];
  return `${capitalize(theme)}: ${suffixes[(index - 1) % suffixes.length]}`;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function serializeTipTapBody(paragraphs: string[]): string {
  return JSON.stringify({
    type: "doc",
    content: paragraphs
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
  });
}

function formatDateSlug(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function gradientFor(index: number): string {
  const gradients = [
    "linear-gradient(135deg, #d6d3c8, #4a4a45)",
    "linear-gradient(135deg, #f0e1c3, #c2603a)",
    "linear-gradient(135deg, #d7c8a0, #5a5a3a)",
    "linear-gradient(135deg, #e5cdbf, #c8261d)",
  ];
  return gradients[index % gradients.length];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
