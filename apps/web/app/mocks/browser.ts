import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Production intentionally uses the same browser-only Dexie + MSW API
// surface as local development and tests. Keep every handler active so
// stale `NEXT_PUBLIC_API_MODE=real` env values cannot bypass MSW and hit
// the Postgres-backed Route Handlers.
export const worker = setupWorker(...handlers);
