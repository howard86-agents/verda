import { expect, test } from "@playwright/test";

const SIGN_IN_RE = /Sign in to continue/i;
const TITLE_RE = /Share something quiet/i;
const SUBMIT_BUTTON_RE = /Submit for review/i;
const LOGIN_DEV_RE = /Login/i;

test("/readers/submit redirects logged-out users to sign in", async ({
  page,
}) => {
  await page.goto("/readers/submit");
  await expect(page.getByText(SIGN_IN_RE)).toBeVisible({ timeout: 15_000 });
});

test("a signed-in member sees the submission form on /readers/submit", async ({
  page,
}) => {
  // Sign in via the dev-tools Login button (which now calls
  // `signIn("credentials", { email: MIRA_EMAIL })` via Auth.js v5
  // — issue #127). The legacy `localStorage.setItem("verda.auth", "1")`
  // shortcut no longer works because the auth surface reads its
  // session from a JWT cookie set by `/api/auth/callback/credentials`.
  await page.goto("/");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: LOGIN_DEV_RE }).click();
  await page.waitForTimeout(500);

  await page.goto("/readers/submit");
  await expect(page.getByRole("heading", { name: TITLE_RE })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByPlaceholder("A walk after dinner")).toBeVisible();
  await expect(
    page.getByRole("button", { name: SUBMIT_BUTTON_RE })
  ).toBeVisible();
});
