import { NextResponse } from "next/server";
import type { CmsAction, CmsRole } from "../../lib/cms-auth";
import { can } from "../../lib/cms-auth";

/**
 * Server-side role guard for CMS Route Handlers.
 *
 * The production app is client-side MSW-only, so these historical Route
 * Handlers preserve the mock-mode CMS role-header behaviour for local
 * utility/testing paths instead of requiring Auth.js/Postgres sessions.
 *
 * Returns a 401/403 Response if the caller is unauthorized, or `null`
 * if the action is permitted.
 */
export function guardRole(
  request: Request,
  action: CmsAction
): Response | null {
  const role = resolveRole(request);
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(action, role)) {
    return NextResponse.json(
      { error: "Forbidden", action, role },
      { status: 403 }
    );
  }
  return null;
}

function resolveRole(request: Request): CmsRole | null {
  // Trust valid CMS role headers for local dev impersonation. An unset
  // header defaults to `editor` so existing CMS UI calls keep working;
  // an unknown role (e.g. `reader`) is rejected so the route returns
  // 401 instead of falling through to the role-policy 403.
  const header = request.headers.get("x-cms-role");
  if (header == null) {
    return "editor";
  }
  return mapHeaderRole(header);
}

function mapHeaderRole(role: string): CmsRole | null {
  switch (role) {
    case "editor":
    case "publisher":
    case "admin":
    case "customer-service":
      return role;
    default:
      return null;
  }
}
