import { expect, type Page, test } from "@playwright/test";

const ARTICLE_ID = "s01";
const TITLE_INPUT = 'input[placeholder="Article title"]';
const PROSE_BODY = ".prose-editor .tiptap";
const SCHEDULE_RE = /^Schedule$|^Reschedule$/;
const SCHEDULED_FOR_RE = /scheduled for/i;
const PUBLISH_LABEL = "Published";

async function setPublisherRole(page: Page) {
  // Pre-seed localStorage so the CmsAuthProvider's initial state lookup
  // sees the publisher role. Done via the addInitScript route below in
  // the test bodies; this helper switches the role mid-page if already
  // mounted by clicking the role pill in the CMS sidebar.
  const pill = page.getByRole("button", { name: "Publisher" }).first();
  await pill.click();
}

async function waitForCmsListReady(page: Page) {
  // Page renders nothing until MSW + Dexie are ready (see Providers).
  // We wait for the role switcher pill to be visible, which only appears
  // after the CMS shell mounts — i.e. after the providers boot.
  await expect(
    page.getByRole("button", { name: "Publisher" }).first()
  ).toBeVisible({ timeout: 15_000 });
}

async function ensureDraftStatus(page: Page) {
  // Reset s01 to draft via the API so the Publish/Schedule branch is on.
  await page.evaluate(async () => {
    await fetch("/api/cms/articles/s01", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-cms-role": "admin",
      },
      body: JSON.stringify({ status: "draft", scheduledAt: undefined }),
    });
  });
}

async function bootEditor(page: Page) {
  await page.goto(`/cms/articles/${ARTICLE_ID}/edit`);
  await expect(page.locator(TITLE_INPUT)).toHaveValue(
    "The quiet rituals that shape a slower morning",
    { timeout: 15_000 }
  );
  await expect(page.locator(PROSE_BODY).first()).toBeVisible();
}

test("publisher can schedule an article via the editor and the API records it", async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("verda.cms.role", "publisher")
  );
  await page.goto("/cms/articles");
  await waitForCmsListReady(page);
  await ensureDraftStatus(page);
  await bootEditor(page);
  await setPublisherRole(page);

  // Open the schedule dialog.
  await page.getByRole("button", { name: SCHEDULE_RE }).click();
  const dialog = page.getByRole("dialog", { name: "Schedule article" });
  await expect(dialog).toBeVisible();

  // Pick a date 2 days from now (still in the future on slow CI).
  const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
  await dialog.locator('input[type="datetime-local"]').fill(local);
  await dialog.getByRole("button", { name: "Schedule" }).click();
  await expect(dialog).not.toBeVisible();

  // Status panel surfaces the scheduled-for caption.
  await expect(page.getByText(SCHEDULED_FOR_RE)).toBeVisible({
    timeout: 5000,
  });

  // The article record reflects status=scheduled.
  const stored = await page.evaluate(async () => {
    const res = await fetch("/api/cms/articles/s01");
    return await res.json();
  });
  expect(stored.status).toBe("scheduled");
  expect(typeof stored.scheduledAt).toBe("string");
});

test("scheduling with a past date publishes immediately", async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("verda.cms.role", "publisher")
  );
  await page.goto("/cms/articles");
  await waitForCmsListReady(page);
  await ensureDraftStatus(page);
  await bootEditor(page);
  await setPublisherRole(page);

  await page.getByRole("button", { name: SCHEDULE_RE }).click();
  const dialog = page.getByRole("dialog", { name: "Schedule article" });
  await expect(dialog).toBeVisible();

  // Type a past datetime-local. The min attribute on the input doesn't
  // prevent JS-driven fill, which is what we want for this test.
  await dialog.locator('input[type="datetime-local"]').fill("2020-01-01T00:00");
  await dialog.getByRole("button", { name: "Schedule" }).click();
  await expect(dialog).not.toBeVisible();

  // Status panel switches to PUBLISHED.
  await expect(page.getByText(PUBLISH_LABEL.toUpperCase())).toBeVisible({
    timeout: 5000,
  });
});

test("a due scheduled article auto-promotes to published on the next listing load", async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("verda.cms.role", "publisher")
  );
  await page.goto("/cms/articles");
  await waitForCmsListReady(page);
  await ensureDraftStatus(page);

  // Pin s01 to the scheduled state with a scheduledAt in the past, then
  // reload the CMS list — the listing handler should auto-promote it.
  await page.evaluate(async () => {
    await fetch("/api/cms/articles/s01", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-cms-role": "admin",
      },
      body: JSON.stringify({
        status: "scheduled",
        scheduledAt: "2020-01-01T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/cms/articles");
  // The "All" filter shows everything; once the listing GET runs, s01
  // should have flipped to published.
  await expect(page.getByText("PUBLISHED").first()).toBeVisible({
    timeout: 15_000,
  });
  const after = await page.evaluate(async () => {
    const res = await fetch("/api/cms/articles/s01");
    return await res.json();
  });
  expect(after.status).toBe("published");
  expect(after.scheduledAt).toBeFalsy();
});
