import { setupWorker } from "msw/browser";
import { isRealApiMode } from "../lib/api-mode";
import {
  handlers,
  migratedReaderProfileHandlers,
  migratedSearchHandlers,
  migratedStoriesHandlers,
  migratedSubmissionHandlers,
} from "./handlers";

// When `NEXT_PUBLIC_API_MODE=real`, drop the handlers for routes that
// the real Postgres-backed backend now serves (issue #126, #128, #133,
// #139). The worker still starts so non-migrated routes (CMS, comments,
// …) keep using the in-browser Dexie store; the migrated routes fall
// through to the real Next.js Route Handlers via
// `onUnhandledRequest: "bypass"`.
const migratedHandlers = [
  ...migratedStoriesHandlers,
  ...migratedSearchHandlers,
  ...migratedReaderProfileHandlers,
  ...migratedSubmissionHandlers,
];
const activeHandlers = isRealApiMode()
  ? handlers.filter((handler) => !migratedHandlers.includes(handler))
  : handlers;

export const worker = setupWorker(...activeHandlers);
