/**
 * API_MODE — production is intentionally pure client-side MSW.
 *
 * Verda previously allowed `NEXT_PUBLIC_API_MODE=real` to drop selected
 * MSW handlers and pass requests through to Postgres-backed Next.js
 * Route Handlers. Production should now keep the same browser-only
 * Dexie + MSW path as local/test builds, so the flag is retained only
 * as a no-op compatibility shim for stale Vercel/env configuration.
 */
export type ApiMode = "mock";

/**
 * Normalised view of `NEXT_PUBLIC_API_MODE`.
 *
 * Always resolves to `mock`; even a stale `NEXT_PUBLIC_API_MODE=real`
 * must not bypass MSW in production.
 */
export const apiMode: ApiMode = "mock";

/**
 * Compatibility helper for older code/tests that asked whether migrated
 * routes should pass through to the Postgres backend.
 */
export function isRealApiMode(_value?: string): boolean {
  return false;
}
