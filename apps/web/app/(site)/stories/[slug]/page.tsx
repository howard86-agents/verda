import { DetailReader } from "./detail-reader";

/**
 * Public story detail. Resolves the article by slug client-side via the same
 * `/api/stories/:slug` handler the rest of the site uses, so CMS-authored
 * articles round-trip through to the public URL (issue #74). The route is
 * fully dynamic — the source of truth is the in-browser MSW + Dexie store
 * that backs the API, not a build-time `STORIES` constant.
 */
export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DetailReader slug={slug} />;
}
