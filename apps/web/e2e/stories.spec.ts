import { expect, test } from "@playwright/test";

test("stories listing renders seeded stories from the mocked API", async ({
  page,
}) => {
  await page.goto("/stories");

  // Wait for MSW + Dexie to boot and stories to render
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 15_000,
  });

  // Verify multiple stories rendered
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
