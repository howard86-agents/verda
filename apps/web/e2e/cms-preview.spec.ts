import { expect, type Page, test } from "@playwright/test";

// Seeded story id (see apps/web/app/lib/seed.ts) — kind=brand, status=published.
const ARTICLE_ID = "s01";
const TITLE = "The quiet rituals that shape a slower morning";

const TITLE_INPUT = 'input[placeholder="Article title"]';
const PROSE_BODY = ".prose-editor .tiptap";

const BODY_TEXT_PATTERN = /choosing one small thing/i;
const WEBVIEW_BADGE_PATTERN = /In-app · アプリ内/;
const TITLE_HEADING_PATTERN = new RegExp(TITLE);

async function waitForEditorLoaded(page: Page) {
  // Editor populates the title input once the seeded article loads via MSW.
  await expect(page.locator(TITLE_INPUT)).toHaveValue(TITLE, {
    timeout: 15_000,
  });
  await expect(page.locator(PROSE_BODY).first()).toBeVisible();
}

test("editor exposes a Preview button that renders the draft body", async ({
  page,
}) => {
  await page.goto(`/cms/articles/${ARTICLE_ID}/edit`);
  await waitForEditorLoaded(page);

  // Preview action is visible to editor+ roles (default role = editor).
  const preview = page.getByRole("button", { name: "Preview" });
  await expect(preview).toBeVisible();

  // Open the preview.
  await preview.click();
  const dialog = page.getByRole("dialog", { name: "Article draft preview" });
  await expect(dialog).toBeVisible();

  // The preview renders the article title in the chrome.
  await expect(
    dialog.getByRole("heading", { name: TITLE_HEADING_PATTERN })
  ).toBeVisible();

  // The seeded bodyJson is rendered through the read-only renderer.
  await expect(dialog.getByText(BODY_TEXT_PATTERN)).toBeVisible();

  // Default mode is desktop; Mobile · WebView toggle is present.
  const desktopBtn = dialog.getByRole("button", { name: "Desktop" });
  const mobileBtn = dialog.getByRole("button", { name: "Mobile · WebView" });
  await expect(desktopBtn).toHaveAttribute("aria-pressed", "true");
  await expect(mobileBtn).toHaveAttribute("aria-pressed", "false");

  // Switching to Mobile · WebView swaps in the WebView chrome.
  await mobileBtn.click();
  await expect(mobileBtn).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByText(WEBVIEW_BADGE_PATTERN)).toBeVisible();

  // Close via Escape.
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("preview reflects unsaved edits made in the editor", async ({ page }) => {
  await page.goto(`/cms/articles/${ARTICLE_ID}/edit`);
  await waitForEditorLoaded(page);

  // Type a new paragraph at the end of the Tiptap editor without saving.
  const proseEditor = page.locator(PROSE_BODY).first();
  await proseEditor.click();
  await page.keyboard.press("End");
  const marker = `Draft preview marker ${Date.now()}`;
  await page.keyboard.type(`\n${marker}`);

  // Open Preview without saving.
  await page.getByRole("button", { name: "Preview" }).click();
  const dialog = page.getByRole("dialog", { name: "Article draft preview" });
  await expect(dialog).toBeVisible();

  // The unsaved marker is rendered through the preview body.
  await expect(dialog.getByText(marker)).toBeVisible();
});

test("preview action is hidden for roles without edit_draft (customer-service)", async ({
  page,
}) => {
  await page.goto(`/cms/articles/${ARTICLE_ID}/edit`);
  await waitForEditorLoaded(page);

  // Switch role via the dev role switcher in the CMS shell sidebar.
  await page.getByRole("button", { name: "CS" }).click();

  // Preview should disappear for customer-service.
  await expect(page.getByRole("button", { name: "Preview" })).toHaveCount(0);
});
