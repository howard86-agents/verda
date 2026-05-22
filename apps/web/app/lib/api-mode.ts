/**
 * API_MODE — controls whether MSW intercepts requests for routes that
 * have been migrated to the real Postgres backend (issue #126).
 *
 * - `mock` (default, also used when the env var is unset or unknown):
 *   MSW handles every route, including the migrated ones, so existing
 *   browser-only behaviour is preserved.
 * - `real`: MSW excludes the migrated handlers, the request bypasses
 *   the worker, and the real Next.js Route Handlers serve it from
 *   Postgres.
 *
 * Reads `NEXT_PUBLIC_API_MODE` so the value is inlined at build time
 * for the client bundle. The flag is intentionally narrow: per-route
 * decisions live in the per-route migrated-handler list rather than
 * here, keeping the cutover footprint visible at the call site.
 */
export type ApiMode = "mock" | "real";

const RAW_API_MODE = process.env.NEXT_PUBLIC_API_MODE;

/**
 * Normalised view of `NEXT_PUBLIC_API_MODE`. Anything other than the
 * literal string `"real"` resolves to `"mock"` so misconfigured envs
 * fall back to the safe path.
 */
export const apiMode: ApiMode = RAW_API_MODE === "real" ? "real" : "mock";

/**
 * Convenience: is the worker expected to passthrough migrated routes?
 */
export function isRealApiMode(
  value: string | undefined = RAW_API_MODE
): boolean {
  return value === "real";
}
