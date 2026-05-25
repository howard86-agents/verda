import { describe, expect, test } from "bun:test";
import type { Article } from "./db";
import { extractStoryListingItems } from "./story-listing";

function article(id: string, kind: Article["kind"]): Article {
  return {
    author: "Reader",
    bodyJson: "[]",
    cat: "Community",
    date: "2026-05-24",
    id,
    imagePrompt: "",
    imageSeed: 1,
    img: "",
    jp: "",
    kind,
    read: 1,
    section: "",
    slug: id,
    sum: "",
    tag: "",
    title: id,
  };
}

describe("story listing response contract", () => {
  test("extracts items from the paginated /api/stories response shape", () => {
    const items = [article("submission-1", "submission")];

    expect(
      extractStoryListingItems({
        items,
        page: 1,
        total: 1,
        totalPages: 1,
      })
    ).toEqual(items);
  });
});
