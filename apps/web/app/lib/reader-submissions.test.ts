import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "./db";
import {
  createSubmission,
  plainTextLength,
  slugForTitle,
  validateSubmission,
} from "./reader-submissions";

const VALID_BODY = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "A short note about a small practice we kept all winter.",
        },
      ],
    },
  ],
});

describe("plainTextLength()", () => {
  test("returns 0 for empty input", () => {
    expect(plainTextLength("")).toBe(0);
  });

  test("returns 0 for malformed JSON", () => {
    expect(plainTextLength("{")).toBe(0);
  });

  test("walks nested content nodes", () => {
    expect(plainTextLength(VALID_BODY)).toBeGreaterThanOrEqual(40);
  });
});

describe("slugForTitle()", () => {
  test("kebab-cases ASCII titles", () => {
    expect(slugForTitle("A walk after dinner")).toBe("a-walk-after-dinner");
  });

  test("strips punctuation and collapses runs", () => {
    expect(slugForTitle("  ::Hello,   World!! ")).toBe("hello-world");
  });

  test("falls back to 'untitled' for empty input", () => {
    expect(slugForTitle("")).toBe("untitled");
    expect(slugForTitle("   ")).toBe("untitled");
  });

  test("preserves Unicode word characters", () => {
    expect(slugForTitle("静かな朝")).toBe("静かな朝");
  });
});

describe("validateSubmission()", () => {
  test("rejects an empty title", () => {
    expect(validateSubmission({ title: "", bodyJson: VALID_BODY })).toEqual({
      ok: false,
      reason: "Title is too short",
    });
  });

  test("rejects a too-long title", () => {
    expect(
      validateSubmission({ title: "x".repeat(300), bodyJson: VALID_BODY })
    ).toEqual({ ok: false, reason: "Title is too long" });
  });

  test("rejects a too-short body", () => {
    expect(
      validateSubmission({
        title: "Some title",
        bodyJson: JSON.stringify({
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "hi" }] },
          ],
        }),
      })
    ).toEqual({
      ok: false,
      reason: "Tell us a little more — body is too short",
    });
  });

  test("accepts a valid draft", () => {
    expect(
      validateSubmission({ title: "A walk after dinner", bodyJson: VALID_BODY })
    ).toEqual({ ok: true });
  });
});

describe("createSubmission() — issue #91", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("persists a pending submission with submittedBy and kind=submission", async () => {
    const article = await createSubmission({
      memberId: "m_4421",
      draft: {
        title: "Reader: a small practice",
        bodyJson: VALID_BODY,
      },
    });
    expect(article.kind).toBe("submission");
    expect(article.status).toBe("pending");
    expect(article.submittedBy).toBe("m_4421");

    const got = await db.articles.get(article.id);
    expect(got?.kind).toBe("submission");
    expect(got?.status).toBe("pending");
    expect(got?.submittedBy).toBe("m_4421");
    expect(got?.title).toBe("Reader: a small practice");
  });

  test("does not appear in the published listing query", async () => {
    await createSubmission({
      memberId: "m_4421",
      draft: { title: "Pending piece", bodyJson: VALID_BODY },
    });
    const published = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "published")
      .toArray();
    expect(published).toHaveLength(0);
  });

  test("rejects an invalid draft before persisting", async () => {
    let threw = false;
    try {
      await createSubmission({
        memberId: "m_4421",
        draft: { title: "", bodyJson: VALID_BODY },
      });
    } catch (e) {
      threw = true;
      expect(e instanceof Error).toBe(true);
    }
    expect(threw).toBe(true);
    const count = await db.articles.count();
    expect(count).toBe(0);
  });
});
