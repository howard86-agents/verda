import { expect, test } from "@playwright/test";

const LOGIN_RE = /Login/i;

test("read -> reward: POST /api/events awards points and updates growth", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(3000);

  // Login
  const loginBtn = page.getByRole("button", { name: LOGIN_RE });
  await loginBtn.click();
  await page.waitForTimeout(500);

  // Directly call the events API to simulate read completion
  const response = await page.evaluate(async () => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "read_complete",
        memberId: "m_4421",
        articleId: "s01",
      }),
    });
    return { status: res.status, body: await res.json() };
  });

  expect(response.status).toBe(200);
  expect(response.body.ok).toBe(true);
  expect(response.body.points).toBe(10);
  expect(response.body.balance).toBe(10);
  expect(response.body.level).toBe(1);

  // Second call should be rejected (once-per-article guard)
  const duplicate = await page.evaluate(async () => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "read_complete",
        memberId: "m_4421",
        articleId: "s01",
      }),
    });
    return { status: res.status };
  });

  expect(duplicate.status).toBe(409);

  // Navigate to grow page and verify balance is reflected
  await page.goto("/grow");
  await expect(
    page.locator(".text-vermilion").filter({ hasText: "10" }).first()
  ).toBeVisible({ timeout: 10_000 });
});
