import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { apiMode } from "../../lib/api-mode";
import type { CmsAction, CmsRole } from "../../lib/cms-auth";
import { can } from "../../lib/cms-auth";

/**
 * Server-side role guard for CMS Route Handlers (issue #129).
 *
 * In `real` API mode, the role is derived from the Auth.js JWT session.
 * In `mock` mode (dev/demo), the `x-cms-role` header is trusted as a
 * local impersonation flag so the CMS UI keeps working without a real
 * sign-in flow for staff users.
 *
 * Returns a 401/403 Response if the caller is unauthorized, or `null`
 * if the action is permitted.
 */
export async function guardRole(
  request: Request,
  action: CmsAction
): Promise<Response | null> {
  const role = await resolveRole(request);
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

async function resolveRole(request: Request): Promise<CmsRole | null> {
  if (apiMode === "real") {
    const session = await auth();
    const sessionRole = session?.user?.role;
    return mapSessionRole(sessionRole);
  }
  // Mock mode: trust the header for local dev impersonation
  const header = request.headers.get("x-cms-role") as CmsRole | null;
  return header || "editor";
}

function mapSessionRole(role: string | undefined): CmsRole | null {
  switch (role) {
    case "editor":
    case "publisher":
    case "admin":
      return role;
    case "customer_service":
      return "customer-service";
    default:
      return null;
  }
}
