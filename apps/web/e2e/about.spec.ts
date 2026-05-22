import { expect, test } from "@playwright/test";

const HERO_RE = /Stories that\s+nourish/i;
const MISSION_RE = /Read once, with care/i;
const GROWTH_RE = /seedling, one nutrient/i;
const EDITOR_RE = /From the editor/i;
const WORDMARK_RE = /^VERDA\.?$/;
const ABOUT_NAV_RE = /^About\b/;
const ABOUT_URL_RE = /\/about$/;

test("/about renders mission, growth explainer, and editorial note", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: HERO_RE })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: MISSION_RE })).toBeVisible();
  await expect(page.getByRole("heading", { name: GROWTH_RE })).toBeVisible();
  await expect(page.getByText(EDITOR_RE)).toBeVisible();
});

test("top nav exposes the About link and reaches /about", async ({ page }) => {
  await page.goto("/");
  // Wait past the splash by anchoring on the wordmark rather than hero
  // copy that other PRs in flight (#88) replace.
  await expect(page.locator("header").getByText(WORDMARK_RE)).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: ABOUT_NAV_RE }).first().click();
  await expect(page).toHaveURL(ABOUT_URL_RE);
  await expect(page.getByRole("heading", { name: HERO_RE })).toBeVisible();
});

test("footer links to /about", async ({ page }) => {
  await page.goto("/about");
  const footerAbout = page
    .locator("footer")
    .getByRole("link", { name: "About" });
  await expect(footerAbout).toBeVisible();
  await footerAbout.click();
  await expect(page).toHaveURL(ABOUT_URL_RE);
});
