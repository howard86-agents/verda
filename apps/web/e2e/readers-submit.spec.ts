import { expect, test } from "@playwright/test";

const SIGN_IN_RE = /Sign in to continue/i;
const TITLE_RE = /Share something quiet/i;
const SUBMIT_BUTTON_RE = /Submit for review/i;

test("/readers/submit redirects logged-out users to sign in", async ({
  page,
}) => {
  await page.goto("/readers/submit");
  await expect(page.getByText(SIGN_IN_RE)).toBeVisible({ timeout: 15_000 });
});

test("a signed-in member sees the submission form on /readers/submit", async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("verda.auth", "1")
  );
  await page.goto("/readers/submit");
  await expect(page.getByRole("heading", { name: TITLE_RE })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByPlaceholder("A walk after dinner")).toBeVisible();
  await expect(
    page.getByRole("button", { name: SUBMIT_BUTTON_RE })
  ).toBeVisible();
});
