import { expect, test } from "@playwright/test";

const LOGIN_RE = /Login/i;
const LOGOUT_RE = /Logout/i;

test("auth toggle switches between logged-in and logged-out states", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(3000);

  // Initially logged out — sign-in button visible
  const signIn = page.getByRole("button", { name: "Sign in" });
  await expect(signIn).toBeVisible({ timeout: 15_000 });

  // Click login via dev tools
  const loginBtn = page.getByRole("button", { name: LOGIN_RE });
  await loginBtn.click();

  // Now member initial should be visible in header
  await expect(signIn).not.toBeVisible();

  // Grow page should show content when logged in
  await page.goto("/grow");
  await expect(page.getByText("Your seedling")).toBeVisible({
    timeout: 10_000,
  });

  // Logout via dev tools
  const logoutBtn = page.getByRole("button", { name: LOGOUT_RE });
  await logoutBtn.click();

  // Grow page should show auth gate
  await expect(page.getByText("Sign in to continue")).toBeVisible();
});

test("collection page requires auth", async ({ page }) => {
  await page.goto("/collection");
  await expect(page.getByText("Sign in to continue")).toBeVisible({
    timeout: 15_000,
  });
});
