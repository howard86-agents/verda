import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { listComments, postComment } from "./comments";
import { db } from "./db";

describe("comments helpers (issue #89)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("listComments returns an empty array when no comments exist", async () => {
    const items = await listComments("s01");
    expect(items).toEqual([]);
  });

  test("postComment persists the row and listComments returns it", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_4421",
      memberName: "Mira Tanaka",
      text: "First read of the morning.",
    });
    expect(posted.articleId).toBe("s01");
    expect(posted.memberName).toBe("Mira Tanaka");
    expect(posted.text).toBe("First read of the morning.");

    const items = await listComments("s01");
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(posted.id);
  });

  test("listComments returns newest-first across multiple posts", async () => {
    const first = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "first",
    });
    // Force second comment's createdAt to be strictly later
    await new Promise((r) => setTimeout(r, 10));
    const second = await postComment({
      articleId: "s01",
      memberId: "m_6033",
      memberName: "Renji",
      text: "second",
    });
    const items = await listComments("s01");
    expect(items.map((c) => c.id)).toEqual([second.id, first.id]);
  });

  test("listComments scopes to the article id", async () => {
    await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "a",
    });
    await postComment({
      articleId: "s02",
      memberId: "m_5102",
      memberName: "Hana",
      text: "b",
    });
    const onS01 = await listComments("s01");
    const onS02 = await listComments("s02");
    expect(onS01).toHaveLength(1);
    expect(onS02).toHaveLength(1);
    expect(onS01[0]?.text).toBe("a");
    expect(onS02[0]?.text).toBe("b");
  });

  test("postComment trims whitespace and rejects empty text", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "   hello   ",
    });
    expect(posted.text).toBe("hello");

    expect(
      postComment({
        articleId: "s01",
        memberId: "m_5102",
        memberName: "Hana",
        text: "    ",
      })
    ).rejects.toThrow("Comment text cannot be empty");
  });

  test("listComments hides soft-removed comments", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "visible",
    });
    await db.comments.update(posted.id, {
      removedAt: new Date().toISOString(),
    });
    const items = await listComments("s01");
    expect(items).toHaveLength(0);
  });

  test("postComment snapshots a name fallback for empty member name", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "",
      text: "hello",
    });
    expect(posted.memberName).toBe("Anonymous");
  });
});
