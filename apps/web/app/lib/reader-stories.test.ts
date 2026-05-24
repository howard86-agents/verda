import { afterEach, describe, expect, mock, test } from "bun:test";
import type { Article } from "./db";
import { fetchReaderStories } from "./reader-stories";

const originalFetch = globalThis.fetch;

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

describe("fetchReaderStories", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  test("merges items from paginated /api/stories responses", async () => {
    const byKind: Record<string, Article[]> = {
      submission: [article("submission-1", "submission")],
      repost: [article("repost-1", "repost")],
      remix: [article("remix-1", "remix")],
    };
    const urls: string[] = [];

    globalThis.fetch = mock((input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      const params = new URLSearchParams(url.split("?")[1]);
      const kind = params.get("kind") ?? "";
      const items = byKind[kind] ?? [];
      return Promise.resolve(
        Response.json({
          items,
          page: 1,
          total: items.length,
          totalPages: 1,
        })
      );
    }) as typeof fetch;

    await expect(fetchReaderStories()).resolves.toEqual([
      byKind.submission[0],
      byKind.repost[0],
      byKind.remix[0],
    ]);
    expect(urls).toEqual([
      "/api/stories?kind=submission&sort=latest&page=1&limit=50",
      "/api/stories?kind=repost&sort=latest&page=1&limit=50",
      "/api/stories?kind=remix&sort=latest&page=1&limit=50",
    ]);
  });
});
