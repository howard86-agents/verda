import { describe, expect, test } from "bun:test";
import { SECTIONS, STORIES } from "@verda/data";
import { STORY_BODIES } from "./story-bodies";

const GRADIENT_RE = /^linear-gradient/;
const SECTION_FILL_ID_RE = /^s(0[7-9]|1\d|20)$/;
const FLAGSHIP_IDS = ["s21", "s22", "s23", "s24"] as const;
const FLAGSHIP_WORD_MIN = 950;

/**
 * Section-fill regression coverage (issue #96).
 *
 * The data package ships story metadata and the seeder shapes it into
 * the published library. These tests pin the editorial commitments from
 * issue #96 directly to the data — every canonical section keeps at
 * least two published stories, multi-part series are grouped via the
 * `series` field, and every story carries the imagePrompt/imageSeed
 * that the apps/cli cover generator consumes (gradient fallback per
 * acceptance #3 stays live in CoverImage).
 */

describe("STORIES section coverage (issue #96)", () => {
  test("every canonical section has at least two published stories", () => {
    for (const section of SECTIONS) {
      const inSection = STORIES.filter((s) => s.section === section.id);
      expect(inSection.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("library has the targeted ~14 net-new section-fill pieces", () => {
    // 6 original (s01–s06) + 14 net-new (s07–s20) = 20 minimum.
    expect(STORIES.length).toBeGreaterThanOrEqual(20);
  });
});

describe("STORIES multi-part series grouping (issue #96)", () => {
  test("at least two distinct multi-part series exist", () => {
    const seriesNames = new Set(
      STORIES.map((s) => s.series?.name).filter(
        (name): name is string => typeof name === "string"
      )
    );
    expect(seriesNames.size).toBeGreaterThanOrEqual(2);
  });

  test("each multi-part series has at least two ordered parts", () => {
    const grouped = new Map<string, number[]>();
    for (const s of STORIES) {
      if (!s.series) {
        continue;
      }
      const ordinals = grouped.get(s.series.name) ?? [];
      ordinals.push(s.series.ordinal);
      grouped.set(s.series.name, ordinals);
    }

    expect(grouped.size).toBeGreaterThanOrEqual(2);
    for (const [, ordinals] of grouped) {
      expect(ordinals.length).toBeGreaterThanOrEqual(2);
      // Ordinals must be 1-based and contiguous within each series so
      // the part indicator on the reader (`Part 0N · …`) is monotone.
      const sorted = [...ordinals].sort((a, b) => a - b);
      expect(sorted[0]).toBe(1);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBe((sorted[i - 1] ?? 0) + 1);
      }
    }
  });

  test("the second multi-part series sits in the Movement section", () => {
    const movementSeries = new Set(
      STORIES.filter((s) => s.section === "movement" && s.series).map(
        (s) => s.series?.name
      )
    );
    // Quiet rituals is in mindful-living; #96 adds a second series in
    // Movement to balance section depth without disturbing the existing
    // grouping.
    expect(movementSeries.size).toBeGreaterThanOrEqual(1);
  });
});

describe("STORIES flagship long reads (issue #95)", () => {
  function wordCount(body: (typeof STORY_BODIES)[string]): number {
    const words: string[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if ("text" in node && typeof node.text === "string") {
        words.push(...(node.text.match(/[A-Za-z0-9’']+/g) ?? []));
      }
      if ("content" in node && Array.isArray(node.content)) {
        for (const child of node.content) {
          visit(child);
        }
      }
    };

    for (const node of body.content) {
      visit(node);
    }
    return words.length;
  }

  test("adds four flagship long reads with rich bodyJson", () => {
    for (const id of FLAGSHIP_IDS) {
      const story = STORIES.find((s) => s.id === id);
      expect(story).toBeDefined();
      expect(story?.imagePrompt.length).toBeGreaterThan(0);
      expect(story?.imageSeed).toBeGreaterThan(0);

      const body = STORY_BODIES[id];
      expect(body).toBeDefined();
      expect(
        body.content.filter((node) => node.type === "heading").length
      ).toBeGreaterThanOrEqual(2);
      expect(
        body.content.filter((node) => node.type === "blockquote").length
      ).toBeGreaterThanOrEqual(1);
      expect(body.content.filter((node) => node.type === "image").length).toBe(
        2
      );
      expect(wordCount(body)).toBeGreaterThanOrEqual(FLAGSHIP_WORD_MIN);
    }
  });

  test("groups one flagship as a 3-part series", () => {
    const houseSeries = STORIES.filter(
      (s) => s.series?.name === "House with seasons"
    ).sort((a, b) => (a.series?.ordinal ?? 0) - (b.series?.ordinal ?? 0));

    expect(houseSeries.map((s) => s.id)).toEqual(["s21", "s22", "s23"]);
    expect(houseSeries.map((s) => s.series?.ordinal)).toEqual([1, 2, 3]);
  });
});

describe("STORIES cover-generation metadata (issue #96)", () => {
  test("every story carries a non-empty imagePrompt and a positive imageSeed", () => {
    for (const s of STORIES) {
      expect(s.imagePrompt.length).toBeGreaterThan(0);
      expect(s.imageSeed).toBeGreaterThan(0);
    }
  });

  test("imageSeeds are unique so the apps/cli generator does not collide", () => {
    const seeds = STORIES.map((s) => s.imageSeed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  test("every story carries a CSS gradient img string for the fallback", () => {
    for (const s of STORIES) {
      expect(s.img).toMatch(GRADIENT_RE);
    }
  });
});

describe("STORIES reader metadata (issue #96)", () => {
  test("every story has a positive reading-time estimate", () => {
    for (const s of STORIES) {
      expect(s.read).toBeGreaterThan(0);
    }
  });

  test("all section-fill stories ship a multi-paragraph body", () => {
    // s07–s20 are the section-fill additions and must render real
    // ~400-700 word content end-to-end on `/stories/[slug]`. The
    // shape check (multiple top-level nodes) is enough to guarantee
    // the reader sees more than the one-paragraph fallback.
    const sectionFillIds = STORIES.filter((s) =>
      SECTION_FILL_ID_RE.test(s.id)
    ).map((s) => s.id);
    expect(sectionFillIds.length).toBeGreaterThanOrEqual(14);
    for (const id of sectionFillIds) {
      const body = STORY_BODIES[id];
      expect(body).toBeDefined();
      expect(body?.content.length).toBeGreaterThan(3);
    }
  });

  test("every story has unique slug and id", () => {
    const slugs = STORIES.map((s) => s.slug);
    const ids = STORIES.map((s) => s.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
