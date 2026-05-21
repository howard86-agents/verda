import { expect, type Page, test } from "@playwright/test";

const LOGIN_RE = /Login/i;
const REDEEMED_BTN_RE = /redeem reward/i;
const REWARD_TITLE_RE = /^Plant\s\d{2}\sreward$/;
const REWARD_CODE_RE = /^VERDA-PLANT-\d{2}$/;

interface SeededItem {
  id: number;
}

/**
 * Insert a fully-grown growth item directly into IndexedDB for the seeded
 * member so the e2e can assert the redeem flow without having to award
 * 300 nutrients through the public flow. Uses raw IndexedDB so we don't
 * depend on Dexie being importable inside `page.evaluate`.
 */
async function seedCompletedItem(page: Page): Promise<SeededItem> {
  return await page.evaluate(
    () =>
      new Promise<SeededItem>((resolve, reject) => {
        const open = indexedDB.open("verda");
        open.onerror = () => reject(open.error);
        open.onsuccess = async () => {
          const handle = open.result;
          try {
            const memberId = "m_4421";
            const tx = handle.transaction("growthItems", "readwrite");
            const store = tx.objectStore("growthItems");
            const all = await new Promise<{ sequence?: number }[]>(
              (res, rej) => {
                const req = store.getAll();
                req.onsuccess = () =>
                  res(req.result as { sequence?: number }[]);
                req.onerror = () => rej(req.error);
              }
            );
            const own = all.filter(
              (it) => (it as { memberId?: string }).memberId === memberId
            );
            const nextSeq =
              own.reduce((max, it) => Math.max(max, it.sequence ?? 0), 0) + 1;
            const id = await new Promise<number>((res, rej) => {
              const req = store.add({
                memberId,
                nutrients: 300,
                level: 4,
                sequence: nextSeq,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              });
              req.onsuccess = () => res(req.result as number);
              req.onerror = () => rej(req.error);
            });
            tx.oncomplete = () => {
              handle.close();
              resolve({ id });
            };
          } catch (e) {
            handle.close();
            reject(e);
          }
        };
      })
  );
}

test("redeem flow: completed item is redeemable, dedup blocks the second attempt", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(3000);

  // Login as the seeded member.
  await page.getByRole("button", { name: LOGIN_RE }).click();
  await page.waitForTimeout(500);

  const seeded = await seedCompletedItem(page);

  // First redeem succeeds and returns the mocked payload shape.
  const first = await page.evaluate(async (id) => {
    const res = await fetch("/api/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: "m_4421", growthItemId: id }),
    });
    return { status: res.status, body: await res.json() };
  }, seeded.id);
  expect(first.status).toBe(200);
  expect(first.body.ok).toBe(true);
  expect(first.body.redemption.provider).toBe("mock");
  expect(first.body.redemption.rewardCode).toMatch(REWARD_CODE_RE);
  expect(first.body.redemption.fulfillmentRef).toBeNull();

  // The second attempt for the same growthItemId is rejected.
  const dup = await page.evaluate(async (id) => {
    const res = await fetch("/api/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: "m_4421", growthItemId: id }),
    });
    return { status: res.status };
  }, seeded.id);
  expect(dup.status).toBe(409);
});

test("redeem CTA on /grow turns into the redeemed marker after success", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(3000);

  await page.getByRole("button", { name: LOGIN_RE }).click();
  await page.waitForTimeout(500);

  await seedCompletedItem(page);

  await page.goto("/grow");

  const redeemBtn = page.getByRole("button", { name: REDEEMED_BTN_RE }).first();
  await expect(redeemBtn).toBeVisible({ timeout: 15_000 });
  await redeemBtn.click();

  // Toast surfaces the mocked reward title + code.
  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(status.getByText(REWARD_TITLE_RE)).toBeVisible();
  await expect(status.getByText(REWARD_CODE_RE)).toBeVisible();

  // The same plant card now shows the Redeemed marker rather than the CTA.
  await expect(page.getByText("✓ Redeemed").first()).toBeVisible();
});
