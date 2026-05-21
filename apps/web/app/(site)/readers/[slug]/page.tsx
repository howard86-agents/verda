import { DetailReader } from "./detail-reader";

/**
 * Public reader/repost/remix detail. Resolves by slug client-side via the
 * same `/api/stories/:slug` handler used everywhere else, so submissions,
 * reposts, and remixes authored in the CMS round-trip through to the public
 * URL (issue #75). The route is fully dynamic — the source of truth is the
 * MSW + Dexie store that backs the API.
 */
export default async function ReaderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DetailReader slug={slug} />;
}
