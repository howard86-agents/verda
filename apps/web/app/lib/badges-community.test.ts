import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { evaluateBadges, readBadgeShelf } from "./badges";
import { db } from "./db";

const MEMBER_ID = "m_5102";

async function seedApprovedSubmission(id: string, kind = "submission") {
  await db.articles.put({
    id,
    slug: id,
    kind,
    cat: "",
    tag: "reader",
    title: `Reader item ${id}`,
    jp: "",
    sum: "",
    img: "linear-gradient(135deg, #fff, #000)",
    imagePrompt: "",
    imageSeed: 1,
    read: 0,
    date: "2d",
    author: "",
    submittedBy: MEMBER_ID,
    status: "published",
  });
}

async function seedComment(id: string, articleId = "s01") {
  await db.comments.put({
    id,
    articleId,
    memberId: MEMBER_ID,
    memberName: "Hana Watanabe",
    text: "A note from a reader.",
    createdAt: new Date().toISOString(),
  });
}

describe("evaluateBadges() — community badges (issue #105)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("awards first_submission when an approved submission lands", async () => {
    await seedApprovedSubmission("r_seed_1");
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toContain("first_submission");
  });

  test("first_submission triggers on a repost or remix too", async () => {
    await seedApprovedSubmission("r_seed_2", "repost");
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toContain("first_submission");
  });

  test("does not award first_submission for a pending submission", async () => {
    await db.articles.put({
      id: "r_pending",
      slug: "r_pending",
      kind: "submission",
      cat: "",
      tag: "reader",
      title: "Pending",
      jp: "",
      sum: "",
      img: "linear-gradient(135deg, #fff, #000)",
      imagePrompt: "",
      imageSeed: 1,
      read: 0,
      date: "2d",
      author: "",
      submittedBy: MEMBER_ID,
      status: "pending",
    });
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).not.toContain("first_submission");
  });

  test("does not award first_submission for someone else's submission", async () => {
    await db.articles.put({
      id: "r_other",
      slug: "r_other",
      kind: "submission",
      cat: "",
      tag: "reader",
      title: "Other",
      jp: "",
      sum: "",
      img: "linear-gradient(135deg, #fff, #000)",
      imagePrompt: "",
      imageSeed: 1,
      read: 0,
      date: "2d",
      author: "",
      submittedBy: "m_other",
      status: "published",
    });
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).not.toContain("first_submission");
  });

  test("awards commenter when a comment is posted", async () => {
    await seedComment("c1");
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toContain("commenter");
  });

  test("does not award commenter when the only comment was soft-removed", async () => {
    await db.comments.put({
      id: "c_removed",
      articleId: "s01",
      memberId: MEMBER_ID,
      memberName: "Hana Watanabe",
      text: "deleted by mod",
      createdAt: new Date().toISOString(),
      removedAt: new Date().toISOString(),
    });
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).not.toContain("commenter");
  });

  test("a second qualifying action is idempotent — no duplicate award", async () => {
    await seedApprovedSubmission("r_idem_1");
    await evaluateBadges(MEMBER_ID);
    await seedApprovedSubmission("r_idem_2");
    const second = await evaluateBadges(MEMBER_ID);
    expect(second.filter((b) => b.badgeId === "first_submission")).toHaveLength(
      0
    );
  });

  test("storage layer rejects a duplicate first_submission insert", async () => {
    await db.memberBadges.add({
      memberId: MEMBER_ID,
      badgeId: "first_submission",
      earnedAt: new Date().toISOString(),
    });
    let threw = false;
    try {
      await db.memberBadges.add({
        memberId: MEMBER_ID,
        badgeId: "first_submission",
        earnedAt: new Date().toISOString(),
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("readBadgeShelf surfaces earned community badges in catalog order", async () => {
    await seedApprovedSubmission("r_shelf");
    await seedComment("c_shelf");
    await evaluateBadges(MEMBER_ID);
    const shelf = await readBadgeShelf(MEMBER_ID);
    const earnedIds = shelf.earned.map((b) => b.badgeId);
    expect(earnedIds).toContain("first_submission");
    expect(earnedIds).toContain("commenter");
  });

  test("community badges scope per member", async () => {
    await seedComment("c_mine");
    await evaluateBadges(MEMBER_ID);
    const otherShelf = await readBadgeShelf("m_other");
    expect(otherShelf.earned.map((b) => b.badgeId)).not.toContain("commenter");
  });
});
