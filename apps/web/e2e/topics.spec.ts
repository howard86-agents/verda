import { expect, test } from "@playwright/test";

const TOPICS_HEADING_RE = /Five quiet sections/i;
const NAV_TOPICS_RE = /^Topics\b/;
const MINDFUL_HEADING_RE = /^Mindful Living\b/;
const NOT_FOUND_RE = /this page could not be found/i;
const TOPICS_URL_RE = /\/topics$/;
const MINDFUL_URL_RE = /\/topics\/mindful-living$/;
const QUIET_RITUALS_RE = /The quiet rituals that shape a slower morning/i;
const PAPER_JOURNAL_RE = /Notes from a paper journal, week 19/i;
const MINDFUL_LINK_RE = /Mindful Living/i;
const ALL_TOPICS_RE = /All topics/i;

test("/topics renders the five-section index", async ({ page }) => {
  await page.goto("/topics");
  await expect(
    page.getByRole("heading", { name: TOPICS_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // All five canonical names render in the index.
  await expect(page.getByText("Mindful Living").first()).toBeVisible();
  await expect(page.getByText("Nutrition").first()).toBeVisible();
  await expect(page.getByText("Movement").first()).toBeVisible();
  await expect(page.getByText("Earth & Garden").first()).toBeVisible();
  await expect(page.getByText("Recipes").first()).toBeVisible();
});

test("/topics/mindful-living lists Mindful Living stories", async ({
  page,
}) => {
  await page.goto("/topics/mindful-living");
  await expect(
    page.getByRole("heading", { name: MINDFUL_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // Two seeded Mindful-Living stories: s01 (quiet rituals) + s05 (paper journal).
  await expect(page.getByText(QUIET_RITUALS_RE)).toBeVisible();
  await expect(page.getByText(PAPER_JOURNAL_RE)).toBeVisible();
});

test("/topics/unknown returns the not-found page", async ({ page }) => {
  await page.goto("/topics/this-section-does-not-exist");
  await expect(page.getByText(NOT_FOUND_RE).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("Top nav exposes a Topics link reaching /topics", async ({ page }) => {
  await page.goto("/topics");
  await expect(
    page.getByRole("heading", { name: TOPICS_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // From topics, click a card to enter Mindful Living.
  await page.getByRole("link", { name: MINDFUL_LINK_RE }).first().click();
  await expect(page).toHaveURL(MINDFUL_URL_RE);
  // And back via the all-topics link.
  await page.getByRole("link", { name: ALL_TOPICS_RE }).click();
  await expect(page).toHaveURL(TOPICS_URL_RE);
  // The nav entry exists.
  await expect(
    page.getByRole("link", { name: NAV_TOPICS_RE }).first()
  ).toBeVisible();
});
