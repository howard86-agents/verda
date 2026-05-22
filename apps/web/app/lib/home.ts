import type { Article } from "./db";

/**
 * Split a fetched listing into the homepage's hero + grid sections.
 *
 * The homepage shows one hero and two three-up rows of "latest stories"
 * fed from the same `/api/stories?kind=brand` endpoint the listing page
 * uses (issue #88). Centralising the slice math here keeps the page
 * component easy to read and gives us a unit test for empty / sparse
 * inputs without rendering React.
 */
export interface HomeFeed {
  /** Hero article — the first item, or `null` if the listing is empty. */
  featured: Article | null;
  /** First six items after the hero, rendered as the latest grids. */
  latest: Article[];
}

/**
 * Pick the featured hero and the latest-grid items from a sorted listing.
 *
 * Assumes the input is already sorted (the listing API sorts by latest by
 * default). Returns `featured = null` and `latest = []` when there is
 * nothing published, so the hero / grid render their empty states.
 */
export function pickHomeFeed(items: Article[] | undefined): HomeFeed {
  if (!items || items.length === 0) {
    return { featured: null, latest: [] };
  }
  return {
    featured: items[0] ?? null,
    latest: items.slice(1, 7),
  };
}
