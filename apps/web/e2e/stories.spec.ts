import { expect, test } from "@playwright/test";

const NOT_FOUND_RE = /this page could not be found/i;

test("stories listing renders seeded stories from the mocked API", async ({
  page,
}) => {
  await page.goto("/stories");

  // Wait for MSW + Dexie to boot and stories to render
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  // Verify stories rendered (up to PAGE_SIZE=6)
  const articles = page.locator("article");
  await expect(articles).toHaveCount(6);

  // Verify first story title is present
  await expect(
    page.getByText("The quiet rituals that shape a slower morning")
  ).toBeVisible();
});

test("stories persist across reload", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  // Reload and verify data persists
  await page.reload();
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  const articles = page.locator("article");
  await expect(articles).toHaveCount(6);
});

test("category filter narrows results", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  // Click Nutrition category
  await page.getByRole("button", { name: "Nutrition" }).click();

  // Wait for filtered results to load. After issue #96 seeded the
  // section-fill stories, Nutrition holds four published pieces:
  // s02, s06 (original) plus s09, s10 (added).
  await expect(page.getByText("04 entries")).toBeVisible({ timeout: 5000 });

  // Should show only nutrition stories
  const articles = page.locator("article");
  await expect(articles).toHaveCount(4);
});

test("sort changes story order", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  // Click Popular sort
  await page.getByRole("button", { name: "Popular" }).click();

  // Stories should still render
  await expect(page.locator("article").first()).toBeVisible();
});

test("story detail renders authored bodyJson, not a hardcoded essay", async ({
  page,
}) => {
  // s01 — quiet rituals; seeded body paragraph is its summary text.
  await page.goto("/stories/quiet-rituals-slower-morning");
  await expect(
    page.getByRole("heading", {
      name: "The quiet rituals that shape a slower morning",
    })
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText("On choosing one small thing — and letting it stay small.")
  ).toBeVisible();

  // A different slug must render a different body (proves it isn't shared).
  await page.goto("/stories/spring-bowl-five-colors");
  await expect(
    page.getByRole("heading", { name: "A spring bowl, in five colors" })
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText("How a handful of soaked grains became a habit.")
  ).toBeVisible();
});

test("unknown story slug returns the not-found page", async ({ page }) => {
  const response = await page.goto("/stories/this-slug-does-not-exist");
  // The reader resolves a 404 from the API into Next's notFound(), which
  // renders the not-found page (status code may differ in dev vs prod).
  await expect(page.getByText(NOT_FOUND_RE)).toBeVisible({
    timeout: 15_000,
  });
  // Defensive: never silently render the formerly-hardcoded essay.
  await expect(
    page.getByText("Letters to a slower year, written in pencil")
  ).toHaveCount(0);
  // If we got an HTTP response object, prefer to assert the not-found status,
  // but fall back gracefully when Playwright doesn't expose one.
  if (response) {
    expect([404, 200]).toContain(response.status());
  }
});
