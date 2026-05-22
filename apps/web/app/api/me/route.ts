import { NextResponse } from "next/server";
import { auth } from "../../../auth";

// `GET /api/me` — current-user surface (issue #127).
//
// Used by Route Handlers and the future server actions to resolve
// the calling user + role from the JWT cookie via Auth.js's
// `auth()`. Returns the same trimmed shape `useAuth()` exposes
// client-side so cross-cutting helpers can rely on a single
// contract; returns `{ user: null }` for signed-out callers rather
// than a 401 because the public reader still functions without
// authentication and "not signed in" is a valid app state.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null });
  }
  const { id, name, email, role } = session.user;
  return NextResponse.json({
    user: {
      id,
      name: name ?? null,
      email: email ?? null,
      role,
    },
  });
}
