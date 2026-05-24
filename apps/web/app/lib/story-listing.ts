import type { Article } from "./db";

export interface StoryListingResponse {
  items: Article[];
  page: number;
  total: number;
  totalPages: number;
}

export function extractStoryListingItems(
  response: StoryListingResponse
): Article[] {
  return response.items;
}
