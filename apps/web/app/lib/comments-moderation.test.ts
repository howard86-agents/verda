import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  listAllRecentComments,
  listComments,
  postComment,
  removeComment,
} from "./comments";
import { db } from "./db";

describe("CMS comment moderation helpers (issue #101)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("listAllRecentComments returns soft-removed rows for moderation", async () => {
    const c1 = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "first",
    });
    await new Promise((r) => setTimeout(r, 5));
    const c2 = await postComment({
      articleId: "s02",
      memberId: "m_6033",
      memberName: "Renji",
      text: "second",
    });
    await db.comments.update(c1.id, {
      removedAt: new Date().toISOString(),
    });

    const all = await listAllRecentComments();
    expect(all).toHaveLength(2);
    expect(all.find((c) => c.id === c1.id)?.removedAt).toBeDefined();
    expect(all.find((c) => c.id === c2.id)?.removedAt).toBeUndefined();
  });

  test("listAllRecentComments orders newest-first across articles", async () => {
    const first = await postComment({
      articleId: "s01",
      memberId: "m_a",
      memberName: "A",
      text: "older",
    });
    await new Promise((r) => setTimeout(r, 10));
    const second = await postComment({
      articleId: "s02",
      memberId: "m_b",
      memberName: "B",
      text: "newer",
    });
    const all = await listAllRecentComments();
    expect(all.map((c) => c.id)).toEqual([second.id, first.id]);
  });

  test("listAllRecentComments respects the limit", async () => {
    for (let i = 0; i < 5; i += 1) {
      await postComment({
        articleId: "s01",
        memberId: "m_a",
        memberName: "A",
        text: `n${i}`,
      });
    }
    const top2 = await listAllRecentComments(2);
    expect(top2).toHaveLength(2);
  });

  test("removeComment soft-flags removedAt and returns the updated row", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "to be removed",
    });
    const updated = await removeComment(posted.id);
    expect(updated?.removedAt).toBeDefined();
  });

  test("removeComment is a no-op for a missing id", async () => {
    const updated = await removeComment("cmt_missing");
    expect(updated).toBeNull();
  });

  test("removed comment is hidden from the public listComments", async () => {
    const posted = await postComment({
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana",
      text: "visible",
    });
    expect(await listComments("s01")).toHaveLength(1);
    await removeComment(posted.id);
    expect(await listComments("s01")).toHaveLength(0);
  });
});
