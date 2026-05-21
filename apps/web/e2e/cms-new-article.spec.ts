import { expect, type Page, test } from "@playwright/test";

const TITLE_INPUT = 'input[placeholder="Article title"]';
const PROSE_BODY = ".prose-editor .tiptap";
const NEW_ARTICLE_TITLE = "Issue 76 dedup probe";
const NEW_EDIT_URL_RE = /\/cms\/articles\/[^/]+\/edit\b/;

async function bootEditor(page: Page) {
  await page.goto("/cms/articles/new");
  await expect(page.locator(TITLE_INPUT)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(PROSE_BODY).first()).toBeVisible();
}

async function clickSaveDraft(page: Page) {
  await page.getByRole("button", { name: "Save draft" }).click();
  // Wait until the button stops showing a saving state.
  await expect(page.getByRole("button", { name: "Save draft" })).toBeEnabled();
}

async function countArticlesWithTitle(page: Page, title: string) {
  return await page.evaluate(async (t) => {
    const res = await fetch("/api/cms/articles");
    const all = (await res.json()) as { title: string }[];
    return all.filter((a) => a.title === t).length;
  }, title);
}

test("first save adopts the server-assigned id; subsequent saves PUT the same record", async ({
  page,
}) => {
  await bootEditor(page);

  // Type a unique title and save.
  await page.locator(TITLE_INPUT).fill(NEW_ARTICLE_TITLE);
  await clickSaveDraft(page);

  // The URL must now point at the saved article's edit page.
  await expect(page).toHaveURL(NEW_EDIT_URL_RE, { timeout: 10_000 });

  // Saving again must not create another article.
  await clickSaveDraft(page);
  await clickSaveDraft(page);

  const dupes = await countArticlesWithTitle(page, NEW_ARTICLE_TITLE);
  expect(dupes).toBe(1);
});

test("autosave after first save does not duplicate the article", async ({
  page,
}) => {
  await bootEditor(page);

  // Unique title for this test run.
  const title = `${NEW_ARTICLE_TITLE} (autosave)`;
  await page.locator(TITLE_INPUT).fill(title);
  await clickSaveDraft(page);
  await expect(page).toHaveURL(NEW_EDIT_URL_RE, { timeout: 10_000 });

  // Edit the body to fire autosave (debounced 3s in the editor).
  await page.locator(PROSE_BODY).first().click();
  await page.keyboard.type(" — added later ");
  // Wait long enough for the 3s autosave to fire and complete.
  await page.waitForTimeout(5000);

  const dupes = await countArticlesWithTitle(page, title);
  expect(dupes).toBe(1);
});

test("reload after first save lands on the saved article's edit URL", async ({
  page,
}) => {
  await bootEditor(page);

  const title = `${NEW_ARTICLE_TITLE} (reload)`;
  await page.locator(TITLE_INPUT).fill(title);
  await clickSaveDraft(page);
  await expect(page).toHaveURL(NEW_EDIT_URL_RE, { timeout: 10_000 });

  await page.reload();
  // The same edit URL still resolves and shows the saved title.
  await expect(page).toHaveURL(NEW_EDIT_URL_RE);
  await expect(page.locator(TITLE_INPUT)).toHaveValue(title, {
    timeout: 15_000,
  });
});
