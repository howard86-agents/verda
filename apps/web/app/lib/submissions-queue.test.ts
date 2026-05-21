import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "./db";
import { createSubmission } from "./reader-submissions";

const VALID_BODY = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "A short field note from the editorial desk on a slow Sunday.",
        },
      ],
    },
  ],
});

async function seedPending(memberId: string, title: string) {
  return await createSubmission({
    memberId,
    draft: { title, bodyJson: VALID_BODY },
  });
}

async function approveDirect(id: string): Promise<void> {
  // Mirrors the approve handler — flips to published with a stamp.
  await db.articles.update(id, {
    status: "published",
    publishedAt: new Date().toISOString(),
  });
}

async function rejectDirect(id: string): Promise<void> {
  await db.articles.update(id, { status: "rejected" });
}

describe("Submission approval queue (issue #102)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("pending submissions are listed and don't appear in the published query", async () => {
    await seedPending("m_5102", "Pending one");
    await seedPending("m_5102", "Pending two");

    const pending = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "pending")
      .toArray();
    expect(pending).toHaveLength(2);

    const published = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "published")
      .toArray();
    expect(published).toHaveLength(0);
  });

  test("approve flips status to published and surfaces in the public query", async () => {
    const article = await seedPending("m_5102", "Will approve");
    await approveDirect(article.id);

    const got = await db.articles.get(article.id);
    expect(got?.status).toBe("published");
    expect(got?.publishedAt).toBeDefined();

    const publicVisible = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "published")
      .toArray();
    expect(publicVisible.find((a) => a.id === article.id)).toBeDefined();
  });

  test("reject flips status to rejected and stays out of the public query", async () => {
    const article = await seedPending("m_5102", "Will reject");
    await rejectDirect(article.id);

    const got = await db.articles.get(article.id);
    expect(got?.status).toBe("rejected");

    const publicVisible = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "published")
      .toArray();
    expect(publicVisible.find((a) => a.id === article.id)).toBeUndefined();
  });

  test("rejected submissions are absent from the pending queue", async () => {
    const a = await seedPending("m_5102", "Stay pending");
    const b = await seedPending("m_5102", "Get rejected");
    await rejectDirect(b.id);

    const pending = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "pending")
      .toArray();
    expect(pending.map((p) => p.id)).toEqual([a.id]);
  });
});
