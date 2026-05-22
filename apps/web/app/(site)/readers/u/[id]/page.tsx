import { ProfileReader } from "./profile-reader";

/**
 * Public reader profile (issue #103).
 *
 * Resolves the member id from the route segment and hands the page off
 * to the client `<ProfileReader />`, which fetches the composed
 * payload from `/api/readers/u/:id`. The route is fully dynamic — the
 * source of truth is the MSW + Dexie store that backs the API. An
 * unknown or soft-deleted member surfaces as `notFound()` from inside
 * the client component, matching the existing reader-detail pattern.
 */
export default async function ReaderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileReader id={id} />;
}
