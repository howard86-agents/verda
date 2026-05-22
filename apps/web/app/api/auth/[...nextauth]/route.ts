import { handlers } from "../../../../auth";

// Auth.js v5 route handlers (issue #127). The single GET/POST surface
// drives every flow — sign-in, sign-out, callback, session, csrf —
// behind the `/api/auth/*` URL prefix that `next-auth/react` and the
// server-side `auth()` helper both target.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
