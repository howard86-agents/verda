import { describe, expect, test } from "bun:test";
import type { Article } from "./db";
import { pickHomeFeed } from "./home";

function fixture(id: string): Article {
  return {
    id,
    slug: id,
    kind: "brand",
    cat: "Mindful Living",
    tag: "morning",
    title: `Story ${id}`,
    jp: "",
    sum: "",
    img: "",
    imagePrompt: "",
    imageSeed: 0,
    read: 5,
    date: "May 18",
    author: "Lin K.",
  };
}

describe("pickHomeFeed()", () => {
  test("returns featured=null and empty latest for an empty listing", () => {
    expect(pickHomeFeed([])).toEqual({ featured: null, latest: [] });
    expect(pickHomeFeed(undefined)).toEqual({ featured: null, latest: [] });
  });

  test("uses the first article as the hero", () => {
    const items = [fixture("a"), fixture("b"), fixture("c")];
    const feed = pickHomeFeed(items);
    expect(feed.featured?.id).toBe("a");
  });

  test("returns up to six latest items after the hero", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h"].map(fixture);
    const feed = pickHomeFeed(items);
    expect(feed.featured?.id).toBe("a");
    expect(feed.latest.map((s) => s.id)).toEqual([
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
    ]);
  });

  test("returns fewer than six latest when the listing is sparse", () => {
    const items = [fixture("a"), fixture("b")];
    const feed = pickHomeFeed(items);
    expect(feed.featured?.id).toBe("a");
    expect(feed.latest.map((s) => s.id)).toEqual(["b"]);
  });

  test("featured-only listing yields an empty latest", () => {
    const feed = pickHomeFeed([fixture("solo")]);
    expect(feed.featured?.id).toBe("solo");
    expect(feed.latest).toEqual([]);
  });
});
