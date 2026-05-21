import { expect, test } from "@playwright/test";

const NOT_FOUND_RE = /this page could not be found/i;
const MAYA_LINK_RE = /instagram\.com\/maya\.cooks/i;

test("reader detail renders authored bodyJson + real attribution per slug", async ({
  page,
}) => {
  // r01 — turmeric porridge submission. Seeded body + attribution differs
  // from r02, proving slugs no longer share hardcoded content.
  await page.goto("/readers/turmeric-porridge");
  await expect(
    page.getByRole("heading", {
      name: "Reader recipe: turmeric porridge, my mother's way",
    })
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("twenty-three minutes")).toBeVisible();
  // Real source URL (from the fetched record), not a hardcoded one.
  await expect(page.getByRole("link", { name: MAYA_LINK_RE })).toBeVisible();
  // License surfaces from the record (rendered in both the attribution slab
  // and the side license panel — assert the first occurrence is visible).
  await expect(
    page.getByText("Reader submission · used with permission").first()
  ).toBeVisible();

  // r03 — remix. Different body and a different contributor list.
  await page.goto("/readers/field-notes-remix");
  await expect(
    page.getByRole("heading", {
      name: "Field notes — a remix of three reader essays",
    })
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText("Three readers sent us their May field notes")
  ).toBeVisible();
  // All three remix contributors render from the article's contributors[].
  await expect(page.getByText("@maya.cooks")).toBeVisible();
  await expect(page.getByText("@a.field")).toBeVisible();
  await expect(page.getByText("@yu.papers")).toBeVisible();
  // License from the record, not a hardcoded blurb.
  await expect(page.getByText("CC BY-NC 4.0").first()).toBeVisible();
});

test("unknown reader slug returns the not-found page", async ({ page }) => {
  await page.goto("/readers/this-slug-does-not-exist");
  await expect(page.getByText(NOT_FOUND_RE)).toBeVisible({
    timeout: 15_000,
  });
  // Defensive: never silently render the formerly-hardcoded essay copy.
  await expect(
    page.getByText("rearranged them into one continuous piece")
  ).toHaveCount(0);
});
