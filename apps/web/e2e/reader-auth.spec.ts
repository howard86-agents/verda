import { expect, test } from "@playwright/test";

// Reader-auth E2E (issue #127). Verifies the comment-form gate the
// acceptance criteria call out: signed-out → disabled CTA, signed-in
// → live textarea backed by `member.id` from the JWT session.

const STORY_PATH = "/stories/quiet-rituals-slower-morning";
const SIGN_IN_TO_COMMENT_RE = /Sign in to leave a comment/i;
const COMMENT_TEXTAREA_PLACEHOLDER_RE = /Share what landed for you/i;
const LOGIN_DEV_RE = /Login/i;

test("signed-out reader sees the sign-in gate on the comment form", async ({
  page,
}) => {
  await page.goto(STORY_PATH);
  // The comment composer renders below the article body. Allow time
  // for MSW + Dexie hydration.
  await expect(page.getByText(SIGN_IN_TO_COMMENT_RE)).toBeVisible({
    timeout: 20_000,
  });
});

test("signed-in reader can compose a comment", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: LOGIN_DEV_RE }).click();
  // Give Auth.js's credentials callback time to set the JWT cookie
  // and `useSession()` time to surface the new user to the tree.
  await page.waitForTimeout(800);

  await page.goto(STORY_PATH);
  await expect(
    page.getByPlaceholder(COMMENT_TEXTAREA_PLACEHOLDER_RE)
  ).toBeVisible({ timeout: 20_000 });
  // The sign-in CTA must be gone now that the textarea is live.
  await expect(page.getByText(SIGN_IN_TO_COMMENT_RE)).not.toBeVisible();
});
