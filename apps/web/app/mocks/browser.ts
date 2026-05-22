import { setupWorker } from "msw/browser";
import { isRealApiMode } from "../lib/api-mode";
import { handlers, migratedStoriesHandlers } from "./handlers";

// When `NEXT_PUBLIC_API_MODE=real`, drop the handlers for routes that
// the real Postgres-backed backend now serves (issue #126). The worker
// still starts so non-migrated routes (CMS, growth, comments, …) keep
// using the in-browser Dexie store; the migrated routes fall through
// to the real Next.js Route Handlers via `onUnhandledRequest: "bypass"`.
const activeHandlers = isRealApiMode()
  ? handlers.filter((handler) => !migratedStoriesHandlers.includes(handler))
  : handlers;

export const worker = setupWorker(...activeHandlers);
