import type { Article } from "./db";
import {
  extractStoryListingItems,
  type StoryListingResponse,
} from "./story-listing";

type ReaderStoryKind = "submission" | "repost" | "remix";

const READER_STORY_KINDS: ReaderStoryKind[] = ["submission", "repost", "remix"];

async function fetchReaderStoriesByKind(
  kind: ReaderStoryKind
): Promise<Article[]> {
  const params = new URLSearchParams({
    kind,
    sort: "latest",
    page: "1",
    limit: "50",
  });
  const res = await fetch(`/api/stories?${params}`);
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as StoryListingResponse;
  return extractStoryListingItems(data);
}

export async function fetchReaderStories(): Promise<Article[]> {
  const lists = await Promise.all(
    READER_STORY_KINDS.map((kind) => fetchReaderStoriesByKind(kind))
  );
  return lists.flat();
}
