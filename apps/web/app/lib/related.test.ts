import { describe, expect, test } from "bun:test";
import type { Article } from "./db";
import { pickRelated } from "./related";

const MINDFUL_PREFIX_RE = /^mindful_/;

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

const TARGET = fixture("t", {
  section: "mindful-living",
  tag: "morning, journal",
});

describe("pickRelated() — issue #100", () => {
  test("never includes the target article", () => {
    const pool = [TARGET, fixture("a", { section: "mindful-living" })];
    const out = pickRelated(TARGET, pool, 2);
    expect(out.find((s) => s.id === "t")).toBeUndefined();
  });

  test("ranks shared section above unrelated candidates", () => {
    const pool = [
      fixture("a", { section: "nutrition", date: "May 22" }),
      fixture("b", { section: "mindful-living", date: "May 10" }),
      fixture("c", { section: "movement", date: "May 20" }),
    ];
    const out = pickRelated(TARGET, pool, 2);
    expect(out[0]?.id).toBe("b");
  });

  test("ranks shared tags too — section beats tag, both add up", () => {
    const pool = [
      // Same section + 1 tag overlap (3 + 1 = 4)
      fixture("a", { section: "mindful-living", tag: "morning" }),
      // Different section, all tags overlap (0 + 2 = 2)
      fixture("b", { section: "nutrition", tag: "morning, journal" }),
      // Different section, one tag overlap (0 + 1 = 1)
      fixture("c", { section: "nutrition", tag: "morning" }),
    ];
    const out = pickRelated(TARGET, pool, 3);
    expect(out.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  test("falls back to latest-in-section when nothing scores", () => {
    // Target has no tags, so only section matters; candidates have
    // neither shared section nor tag overlap.
    const target = fixture("t", { section: "mindful-living", tag: "" });
    const pool = [
      fixture("a", { section: "nutrition", date: "May 10" }),
      fixture("b", { section: "mindful-living", date: "May 18", tag: "" }),
      fixture("c", { section: "mindful-living", date: "May 20", tag: "" }),
    ];
    const out = pickRelated(target, pool, 2);
    // 'b' and 'c' both score +3 for section, c is more recent — both
    // qualify and order is c, b.
    expect(out.map((s) => s.id)).toEqual(["c", "b"]);
  });

  test("falls back to latest overall when no section overlap and no scores", () => {
    const target = fixture("t", { section: "mindful-living", tag: "" });
    const pool = [
      fixture("a", { section: "nutrition", date: "May 10" }),
      fixture("b", { section: "movement", date: "May 22" }),
      fixture("c", { section: "recipes", date: "May 18" }),
    ];
    const out = pickRelated(target, pool, 2);
    expect(out.map((s) => s.id)).toEqual(["b", "c"]);
  });

  test("breaks score ties by date desc", () => {
    const pool = [
      fixture("a", { section: "mindful-living", date: "May 10" }),
      fixture("b", { section: "mindful-living", date: "May 22" }),
    ];
    const out = pickRelated(TARGET, pool, 2);
    expect(out.map((s) => s.id)).toEqual(["b", "a"]);
  });

  test("two different targets see meaningfully different lists", () => {
    const pool = [
      fixture("nutrition_old", {
        section: "nutrition",
        tag: "recipe",
        date: "May 10",
      }),
      fixture("nutrition_new", {
        section: "nutrition",
        tag: "pantry",
        date: "May 22",
      }),
      fixture("mindful_a", {
        section: "mindful-living",
        tag: "morning",
        date: "May 18",
      }),
      fixture("mindful_b", {
        section: "mindful-living",
        tag: "journal",
        date: "May 16",
      }),
      fixture("movement", {
        section: "movement",
        tag: "practice",
        date: "May 20",
      }),
    ];
    const t1 = fixture("t1", {
      section: "mindful-living",
      tag: "morning, journal",
    });
    const t2 = fixture("t2", { section: "nutrition", tag: "recipe" });
    const a = pickRelated(t1, pool, 2);
    const b = pickRelated(t2, pool, 2);
    expect(a.map((s) => s.id)).not.toEqual(b.map((s) => s.id));
    expect(a[0]?.id).toMatch(MINDFUL_PREFIX_RE);
    expect(b[0]?.id).toBe("nutrition_old");
  });

  test("respects the limit argument", () => {
    const pool = Array.from({ length: 8 }, (_, i) =>
      fixture(`s${i}`, { section: "mindful-living" })
    );
    expect(pickRelated(TARGET, pool, 1)).toHaveLength(1);
    expect(pickRelated(TARGET, pool, 4)).toHaveLength(4);
  });

  test("handles an empty pool gracefully", () => {
    expect(pickRelated(TARGET, [], 2)).toEqual([]);
  });

  test("dedupes the section fallback against the scored picks", () => {
    // 'a' scores via tag overlap; the section fallback would also
    // include it. The result must contain 'a' once.
    const pool = [
      fixture("a", {
        section: "mindful-living",
        tag: "morning",
        date: "May 22",
      }),
      fixture("b", {
        section: "mindful-living",
        tag: "",
        date: "May 18",
      }),
      fixture("c", {
        section: "mindful-living",
        tag: "",
        date: "May 14",
      }),
    ];
    const out = pickRelated(TARGET, pool, 3);
    expect(out.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(new Set(out.map((s) => s.id)).size).toBe(out.length);
  });
});
