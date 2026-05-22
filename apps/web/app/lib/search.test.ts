import { describe, expect, test } from "bun:test";
import type { Article } from "./db";
import { flattenBodyJson, searchArticles } from "./search";

function fixture(id: string, partial: Partial<Article> = {}): Article {
  return {
    id,
    slug: id,
    kind: "brand",
    cat: "",
    tag: "",
    title: `Story ${id}`,
    jp: "",
    sum: "",
    img: "",
    imagePrompt: "",
    imageSeed: 0,
    read: 5,
    date: "May 18",
    author: "Lin K.",
    ...partial,
  };
}

const POOL: Article[] = [
  fixture("s01", {
    title: "The quiet rituals that shape a slower morning",
    sum: "On choosing one small thing — and letting it stay small.",
    section: "mindful-living",
    tag: "morning",
    bodyJson: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "I keep a single ceramic cup by the window.",
            },
          ],
        },
      ],
    }),
    date: "May 18",
  }),
  fixture("s02", {
    title: "A spring bowl, in five colors",
    sum: "How a handful of soaked grains became a habit.",
    section: "nutrition",
    tag: "recipe",
    date: "May 16",
  }),
  fixture("s03", {
    title: "Reading the soil",
    sum: "Curling, yellow tips, and the patience of clay.",
    section: "earth-garden",
    tag: "season",
    date: "May 14",
  }),
];

describe("flattenBodyJson()", () => {
  test("returns empty for missing or malformed input", () => {
    expect(flattenBodyJson(undefined)).toBe("");
    expect(flattenBodyJson("")).toBe("");
    expect(flattenBodyJson("{not json")).toBe("");
  });

  test("walks nested content and joins text leaves", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "first" },
            { type: "text", text: " " },
            { type: "text", text: "second" },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "third" }],
        },
      ],
    });
    expect(flattenBodyJson(json)).toBe("first   second third");
  });
});

describe("searchArticles() — issue #99", () => {
  test("empty query returns []", () => {
    expect(searchArticles("", POOL)).toEqual([]);
    expect(searchArticles("   ", POOL)).toEqual([]);
  });

  test("matches title", () => {
    const hits = searchArticles("rituals", POOL);
    expect(hits.map((h) => h.article.id)).toEqual(["s01"]);
    expect(hits[0]?.matchedFields).toContain("title");
  });

  test("matches summary", () => {
    const hits = searchArticles("habit", POOL);
    expect(hits.map((h) => h.article.id)).toEqual(["s02"]);
    expect(hits[0]?.matchedFields).toContain("summary");
  });

  test("matches tag", () => {
    const hits = searchArticles("recipe", POOL);
    expect(hits.map((h) => h.article.id)).toEqual(["s02"]);
    expect(hits[0]?.matchedFields).toContain("tag");
  });

  test("matches section name (resolved from id)", () => {
    const hits = searchArticles("Mindful", POOL);
    expect(hits.map((h) => h.article.id)).toEqual(["s01"]);
    expect(hits[0]?.matchedFields).toContain("section");
  });

  test("matches body text from flattened bodyJson", () => {
    const hits = searchArticles("ceramic", POOL);
    expect(hits.map((h) => h.article.id)).toEqual(["s01"]);
    expect(hits[0]?.matchedFields).toContain("body");
  });

  test("title matches outrank body matches", () => {
    const titlePool = [
      fixture("body-only", {
        title: "Untitled",
        bodyJson: JSON.stringify({
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "windows" }] },
          ],
        }),
      }),
      fixture("title-match", {
        title: "Windows on a slower year",
      }),
    ];
    const hits = searchArticles("windows", titlePool);
    expect(hits[0]?.article.id).toBe("title-match");
  });

  test("title prefix gets a bonus", () => {
    const pool = [
      fixture("a", { title: "Quiet rituals shape mornings" }),
      fixture("b", { title: "Notes on quiet rituals" }),
    ];
    const hits = searchArticles("quiet", pool);
    expect(hits[0]?.article.id).toBe("a");
  });

  test("returns no-results signal when nothing matches", () => {
    expect(searchArticles("nonexistent-token", POOL)).toEqual([]);
  });

  test("respects limit", () => {
    const big = Array.from({ length: 10 }, (_, i) =>
      fixture(`m${i}`, { title: `morning ${i}`, tag: "morning" })
    );
    expect(searchArticles("morning", big, 3)).toHaveLength(3);
  });

  test("breaks ties by date desc", () => {
    const pool = [
      fixture("old", { title: "Quiet morning", date: "May 10" }),
      fixture("new", { title: "Quiet morning", date: "May 22" }),
    ];
    const hits = searchArticles("quiet morning", pool);
    expect(hits[0]?.article.id).toBe("new");
  });

  test("counts multiple occurrences per field", () => {
    const pool = [
      fixture("once", { title: "morning" }),
      fixture("twice", { title: "morning morning" }),
    ];
    const hits = searchArticles("morning", pool);
    expect(hits[0]?.article.id).toBe("twice");
  });
});
