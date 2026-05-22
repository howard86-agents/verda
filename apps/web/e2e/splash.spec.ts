import { expect, test } from "@playwright/test";

const SPLASH_LABEL = "Loading Verda";
const WORDMARK_RE = /^VERDA\.?$/;
// Issue #88: the homepage hero now reads from the published store. The
// first seeded brand story ("May 18") is the quiet-rituals piece, so we
// anchor on that real title rather than the old hardcoded mockup. We
// also assert the legacy "Letters to a slower year" copy is no longer
// anywhere on the page.
const HERO_HEADING_RE = /The quiet rituals that shape a slower morning/i;
const LEGACY_HERO_RE = /Letters to a slower year/i;

test("public route shows the branded splash before MSW + Dexie are ready", async ({
  page,
}) => {
  // Slow the Dexie seed deliberately so the splash is observable.
  // We do this by intercepting a network response that the app waits
  // on; the simplest signal is the MSW worker registration. Setting
  // an offline route block during goto reliably keeps the providers
  // in their pre-ready state long enough to assert the splash.
  await page.route("**/mockServiceWorker.js", async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.continue();
  });

  await page.goto("/");
  // The splash exposes a status role and an aria-label. Either is enough
  // proof the user did not see a blank screen.
  const splash = page.getByRole("status", { name: SPLASH_LABEL });
  await expect(splash).toBeVisible();
  // Wordmark renders inside the splash.
  await expect(splash.getByText(WORDMARK_RE)).toBeVisible();
});

test("CMS route shows the branded splash before providers are ready", async ({
  page,
}) => {
  await page.route("**/mockServiceWorker.js", async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.continue();
  });
  await page.goto("/cms/articles");
  const splash = page.getByRole("status", { name: SPLASH_LABEL });
  await expect(splash).toBeVisible();
  await expect(splash.getByText(WORDMARK_RE)).toBeVisible();
});

test("splash is replaced by the real UI once the providers are ready", async ({
  page,
}) => {
  await page.goto("/");
  // Eventually the home hero — sourced from the latest published article —
  // renders.
  await expect(
    page.getByRole("heading", { name: HERO_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // …and the splash is gone.
  await expect(
    page.getByRole("status", { name: SPLASH_LABEL })
  ).not.toBeVisible();
  // The legacy hardcoded mockup must not appear (issue #88).
  await expect(page.getByText(LEGACY_HERO_RE)).toHaveCount(0);
});
