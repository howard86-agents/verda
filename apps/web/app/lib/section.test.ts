import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SECTIONS } from "@verda/data";
import { db } from "./db";
import { sectionLabel, seriesPartLabel } from "./section";

describe("section/series content-model fields (issue #87)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("five canonical sections seed and round-trip", async () => {
    await db.sections.bulkPut(SECTIONS);
    const all = await db.sections.toArray();
    expect(all).toHaveLength(5);
    expect(all.map((s) => s.id).sort()).toEqual(
      [
        "earth-garden",
        "mindful-living",
        "movement",
        "nutrition",
        "recipes",
      ].sort()
    );
    expect(all.find((s) => s.id === "earth-garden")?.name).toBe(
      "Earth & Garden"
    );
  });

  test("article round-trips section + series + submittedBy through Dexie", async () => {
    await db.articles.put({
      id: "x01",
      slug: "x01",
      kind: "brand",
      cat: "Mindful Living",
      section: "mindful-living",
      series: { name: "Quiet rituals", ordinal: 2 },
      submittedBy: "m_5102",
      tag: "morning",
      title: "T",
      jp: "",
      sum: "",
      img: "",
      imagePrompt: "",
      imageSeed: 0,
      read: 1,
      date: "May 18",
      author: "Lin K.",
    });
    const got = await db.articles.get("x01");
    expect(got?.section).toBe("mindful-living");
    expect(got?.series?.name).toBe("Quiet rituals");
    expect(got?.series?.ordinal).toBe(2);
    expect(got?.submittedBy).toBe("m_5102");
  });

  test("filtering by the new section index returns matching rows", async () => {
    await db.articles.bulkPut([
      {
        id: "a",
        slug: "a",
        kind: "brand",
        cat: "Mindful Living",
        section: "mindful-living",
        tag: "",
        title: "A",
        jp: "",
        sum: "",
        img: "",
        imagePrompt: "",
        imageSeed: 0,
        read: 0,
        date: "May 18",
        author: "",
      },
      {
        id: "b",
        slug: "b",
        kind: "brand",
        cat: "Nutrition",
        section: "nutrition",
        tag: "",
        title: "B",
        jp: "",
        sum: "",
        img: "",
        imagePrompt: "",
        imageSeed: 0,
        read: 0,
        date: "May 17",
        author: "",
      },
    ]);
    const mindful = await db.articles
      .where("section")
      .equals("mindful-living")
      .toArray();
    expect(mindful).toHaveLength(1);
    expect(mindful[0]?.id).toBe("a");
  });

  test("filtering by submittedBy index returns reader-authored items only", async () => {
    await db.articles.bulkPut([
      {
        id: "r01",
        slug: "r01",
        kind: "submission",
        cat: "",
        submittedBy: "m_5102",
        tag: "reader",
        title: "R",
        jp: "",
        sum: "",
        img: "",
        imagePrompt: "",
        imageSeed: 0,
        read: 0,
        date: "2d",
        author: "",
      },
      {
        id: "s01",
        slug: "s01",
        kind: "brand",
        cat: "Mindful Living",
        section: "mindful-living",
        tag: "morning",
        title: "S",
        jp: "",
        sum: "",
        img: "",
        imagePrompt: "",
        imageSeed: 0,
        read: 0,
        date: "May 18",
        author: "Lin K.",
      },
    ]);
    const byMember = await db.articles
      .where("submittedBy")
      .equals("m_5102")
      .toArray();
    expect(byMember).toHaveLength(1);
    expect(byMember[0]?.id).toBe("r01");
  });
});

describe("sectionLabel()", () => {
  test("maps a canonical section id to its display name", () => {
    expect(sectionLabel({ section: "mindful-living" })).toBe("Mindful Living");
    expect(sectionLabel({ section: "earth-garden" })).toBe("Earth & Garden");
  });

  test("falls back to legacy cat when section is missing", () => {
    expect(sectionLabel({ cat: "Mindful Living" })).toBe("Mindful Living");
  });

  test("falls back to legacy cat when section is unknown", () => {
    expect(sectionLabel({ section: "made-up", cat: "Fallback" })).toBe(
      "Fallback"
    );
  });

  test("returns empty string for unmigrated rows with no cat", () => {
    expect(sectionLabel({})).toBe("");
  });
});

describe("seriesPartLabel()", () => {
  test("renders Part 0N · Series Name for grouped stories", () => {
    expect(seriesPartLabel({ name: "Quiet rituals", ordinal: 2 })).toBe(
      "Part 02 · Quiet rituals"
    );
  });

  test("zero-pads single-digit ordinals", () => {
    expect(seriesPartLabel({ name: "S", ordinal: 1 })).toBe("Part 01 · S");
  });

  test("returns null for standalone stories with no series", () => {
    expect(seriesPartLabel(undefined)).toBeNull();
  });
});
