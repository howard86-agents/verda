import { expect, test } from "@playwright/test";

const NOT_FOUND_RE = /this page could not be found/i;
const HANA_HEADING_RE = /^Hana Watanabe\b/;
const TURMERIC_TITLE_RE = /Reader recipe: turmeric porridge/i;
const SMALL_BENTO_TITLE_RE = /A small bento on a long train/i;
const READERS_LISTING_URL_RE = /\/readers$/;
const READER_DETAIL_URL_RE = /\/readers\/turmeric-porridge$/;
const LV_02_RE = /Lv\s*02/i;
const NUTRIENTS_RE = /\bnutrients?\b/i;
const NUTRIENT_PROGRESS_RE = /\b60 \/ \d+\b/;
const BROWSE_ALL_RE = /Browse all/i;

test("/readers/u/[id] renders the seeded member's public profile", async ({
  page,
}) => {
  // m_5102 (Hana Watanabe) submitted r01 (turmeric porridge) and r04
  // (a small bento) in the seed data. The profile must render her
  // display name, "member since" string, current plant + level, and
  // both approved submissions.
  await page.goto("/readers/u/m_5102");

  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // "Member since" — the seeded `joined` string from the member row.
  await expect(page.getByText("Joined April 2024")).toBeVisible();
  // Plant + level. Hana has nutrients=60 / level=2 in the seed, which
  // resolves to "Sprout" via the growth rules.
  await expect(page.getByText(LV_02_RE)).toBeVisible();
  await expect(page.getByText("Sprout")).toBeVisible();
  // Both seeded approved submissions render as cards.
  await expect(page.getByText(TURMERIC_TITLE_RE).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: SMALL_BENTO_TITLE_RE }).first()
  ).toBeVisible();
});

test("public profile never exposes email or private nutrient counts", async ({
  page,
}) => {
  await page.goto("/readers/u/m_5102");
  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // Email from the seed data is `hana.w@example.com` — must never
  // surface on the public profile.
  await expect(page.getByText("hana.w@example.com")).toHaveCount(0);
  // The raw nutrient count (60 in the seed) and the literal word
  // "nutrient" should never appear on the public profile either —
  // the public surface only carries the level + plant name.
  await expect(page.getByText(NUTRIENTS_RE)).toHaveCount(0);
  await expect(page.getByText(NUTRIENT_PROGRESS_RE)).toHaveCount(0);
});

test("profile cards link to the reader detail at /readers/[slug]", async ({
  page,
}) => {
  await page.goto("/readers/u/m_5102");
  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  // Click through to the turmeric-porridge detail.
  await page.getByRole("link", { name: TURMERIC_TITLE_RE }).first().click();
  await expect(page).toHaveURL(READER_DETAIL_URL_RE);
});

test("/readers/u/[id] for an unknown member returns the not-found page", async ({
  page,
}) => {
  await page.goto("/readers/u/m_does_not_exist");
  await expect(page.getByText(NOT_FOUND_RE).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("the profile carries a 'Browse all' link back to the readers listing", async ({
  page,
}) => {
  await page.goto("/readers/u/m_5102");
  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: BROWSE_ALL_RE }).click();
  await expect(page).toHaveURL(READERS_LISTING_URL_RE);
});

test("the profile renders the earned community-badge shelf (issue #105)", async ({
  page,
}) => {
  await page.goto("/readers/u/m_5102");
  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });

  // Hand-award the two community badges to the seeded member by
  // posting a comment + approving a submission as the rest of the
  // app would. This drives the same evaluateBadges path the runtime
  // handlers do (#104 is sibling, so we can't rely on its rewards
  // here, but the comment / approve paths still trigger badges on
  // this branch).
  await page.evaluate(async () => {
    // Comment as Hana on s01 — fires the comment-post handler which
    // calls evaluateBadges and awards `commenter`.
    await fetch("/api/articles/s01/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: "m_5102",
        memberName: "Hana Watanabe",
        text: "Profile-shelf e2e marker comment.",
      }),
    });
    // Create a pending submission for Hana, then approve it as admin
    // — fires evaluateBadges and awards `first_submission`.
    const created = await fetch("/api/readers/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cms-role": "admin",
      },
      body: JSON.stringify({
        memberId: "m_5102",
        title: "Profile shelf e2e marker submission",
        bodyJson: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "marker body" }],
            },
          ],
        }),
      }),
    });
    if (created.ok) {
      const article = (await created.json()) as { id: string };
      await fetch(`/api/cms/submissions/${article.id}/approve`, {
        method: "POST",
        headers: { "x-cms-role": "admin" },
      });
    }
  });

  // Reload so the profile re-fetches with the freshly awarded badges.
  await page.goto("/readers/u/m_5102");
  await expect(
    page.getByRole("heading", { name: HANA_HEADING_RE })
  ).toBeVisible({ timeout: 15_000 });

  const badgeShelf = page.getByLabel("Earned badges");
  await expect(badgeShelf).toBeVisible();
  await expect(badgeShelf.getByText("First submission")).toBeVisible();
  await expect(badgeShelf.getByText("Commenter")).toBeVisible();
  // Locked-badge copy must not surface on the public profile.
  await expect(page.getByText("Locked")).toHaveCount(0);
});
