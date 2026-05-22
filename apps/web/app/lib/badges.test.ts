import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { BADGE_CATALOG } from "@verda/data";
import { evaluateBadges, readBadgeShelf } from "./badges";
import { db } from "./db";

const MEMBER_ID = "m_test";

async function logRead(articleId: string): Promise<void> {
  await db.behaviorLogs.add({
    memberId: MEMBER_ID,
    action: "read_complete",
    articleId,
    createdAt: new Date().toISOString(),
  });
}

describe("evaluateBadges() — issue #93", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("awards no badges for a member with no activity", async () => {
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded).toHaveLength(0);
    const shelf = await readBadgeShelf(MEMBER_ID);
    expect(shelf.earned).toHaveLength(0);
    // Catalog grew with the community badges in issue #105; assert
    // against `BADGE_CATALOG.length` so future additions don't force
    // another test rewrite.
    expect(shelf.locked).toHaveLength(BADGE_CATALOG.length);
  });

  test("awards first_read after one read_complete", async () => {
    await logRead("s01");
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toEqual(["first_read"]);
  });

  test("awards reader_10 once 10 reads land", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await logRead(`s${String(i).padStart(2, "0")}`);
    }
    const awarded = await evaluateBadges(MEMBER_ID);
    const ids = awarded.map((b) => b.badgeId).sort();
    expect(ids).toEqual(["first_read", "reader_10"]);
  });

  test("awards reader_25 once 25 reads land", async () => {
    for (let i = 1; i <= 25; i += 1) {
      await logRead(`a${String(i).padStart(2, "0")}`);
    }
    const awarded = await evaluateBadges(MEMBER_ID);
    const ids = awarded.map((b) => b.badgeId).sort();
    expect(ids).toEqual(["first_read", "reader_10", "reader_25"]);
  });

  test("awards first_bloom when a growth item reaches level 3", async () => {
    await db.growthItems.add({
      memberId: MEMBER_ID,
      nutrients: 200,
      level: 3,
      sequence: 1,
    });
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toEqual(["first_bloom"]);
  });

  test("does not award first_bloom below level 3", async () => {
    await db.growthItems.add({
      memberId: MEMBER_ID,
      nutrients: 60,
      level: 2,
      sequence: 1,
    });
    const awarded = await evaluateBadges(MEMBER_ID);
    expect(awarded.map((b) => b.badgeId)).toEqual([]);
  });

  test("is idempotent: a second call awards nothing", async () => {
    await logRead("s01");
    await evaluateBadges(MEMBER_ID);
    const second = await evaluateBadges(MEMBER_ID);
    expect(second).toHaveLength(0);
  });

  test("readBadgeShelf returns earned + locked split in catalog order", async () => {
    await logRead("s01");
    await evaluateBadges(MEMBER_ID);
    const shelf = await readBadgeShelf(MEMBER_ID);
    expect(shelf.earned.map((b) => b.badgeId)).toEqual(["first_read"]);
    // The locked list is the rest of `BADGE_CATALOG` in display order,
    // which now includes the community badges added in issue #105.
    expect(shelf.locked).toEqual(
      BADGE_CATALOG.filter((b) => b.id !== "first_read").map((b) => b.id)
    );
  });

  test("storage layer rejects duplicate awards directly", async () => {
    await db.memberBadges.add({
      memberId: MEMBER_ID,
      badgeId: "first_read",
      earnedAt: new Date().toISOString(),
    });
    let threw = false;
    try {
      await db.memberBadges.add({
        memberId: MEMBER_ID,
        badgeId: "first_read",
        earnedAt: new Date().toISOString(),
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("scopes awards per member", async () => {
    await logRead("s01");
    await evaluateBadges(MEMBER_ID);
    const otherShelf = await readBadgeShelf("m_other");
    expect(otherShelf.earned).toHaveLength(0);
    expect(otherShelf.locked).toHaveLength(BADGE_CATALOG.length);
  });
});
