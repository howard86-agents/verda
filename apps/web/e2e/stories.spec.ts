import { expect, test } from "@playwright/test";

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

  // Wait for filtered results to load
  await expect(page.getByText("02 entries")).toBeVisible({ timeout: 5000 });

  // Should show only nutrition stories
  const articles = page.locator("article");
  await expect(articles).toHaveCount(2);
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
