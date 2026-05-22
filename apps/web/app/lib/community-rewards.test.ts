import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  COMMUNITY_REWARD_RULES,
  REWARD_RULE_COMMENT_POST,
  REWARD_RULE_REACTION_REACT,
  REWARD_RULE_SUBMISSION_APPROVED,
} from "./community-rewards";
import { db } from "./db";
import { awardPoints } from "./rewards";

const RULES = [
  { level: 1, name: "Seed", jp: "種", threshold: 0 },
  { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
  { level: 3, name: "Bloom", jp: "花", threshold: 150 },
];

async function setupCommunityRewards(): Promise<void> {
  await db.growthRules.bulkPut(RULES);
  await db.rewardRules.bulkPut(COMMUNITY_REWARD_RULES);
}

async function ledgerFor(memberId: string) {
  return await db.pointLedger.where("memberId").equals(memberId).toArray();
}

async function growthFor(memberId: string) {
  return await db.growthItems.where("memberId").equals(memberId).toArray();
}

describe("community-rewards seed shape (issue #104)", () => {
  test("ships three rules: submission +20, comment +3, reaction +1", () => {
    expect(COMMUNITY_REWARD_RULES).toHaveLength(3);
    const byAction = new Map(COMMUNITY_REWARD_RULES.map((r) => [r.action, r]));
    expect(byAction.get("submission_approved")?.points).toBe(20);
    expect(byAction.get("comment_post")?.points).toBe(3);
    expect(byAction.get("reaction_react")?.points).toBe(1);
  });

  test("every rule starts enabled with a per-article limit", () => {
    for (const rule of COMMUNITY_REWARD_RULES) {
      expect(rule.enabled).toBe(true);
      expect(rule.limitType).toBe("per-article");
    }
  });

  test("rule ids are unique and stable", () => {
    const ids = COMMUNITY_REWARD_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(
      [
        REWARD_RULE_COMMENT_POST.id,
        REWARD_RULE_REACTION_REACT.id,
        REWARD_RULE_SUBMISSION_APPROVED.id,
      ].sort()
    );
  });
});

describe("comment_post community reward (issue #104)", () => {
  beforeEach(async () => {
    await db.open();
    await setupCommunityRewards();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("awards +3 nutrients on the first comment per article", async () => {
    const result = await awardPoints("m_5102", "comment_post", "s01");
    expect(result.points).toBe(3);
    expect(result.balance).toBe(3);

    const ledger = await ledgerFor("m_5102");
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.amount).toBe(3);

    // Growth allocation is part of the same pipeline; the active item
    // exists with the awarded delta.
    const growth = await growthFor("m_5102");
    expect(growth).toHaveLength(1);
    expect(growth[0]?.nutrients).toBe(3);
  });

  test("the second comment on the same article does not re-award", async () => {
    await awardPoints("m_5102", "comment_post", "s01");
    const result = await awardPoints("m_5102", "comment_post", "s01");
    expect(result.points).toBe(0);
    const ledger = await ledgerFor("m_5102");
    expect(ledger).toHaveLength(1);
  });

  test("a comment on a different article rewards independently", async () => {
    await awardPoints("m_5102", "comment_post", "s01");
    const result = await awardPoints("m_5102", "comment_post", "s02");
    expect(result.points).toBe(3);
    expect(result.balance).toBe(6);
    const ledger = await ledgerFor("m_5102");
    expect(ledger).toHaveLength(2);
  });

  test("disabled rule awards 0 and writes no ledger entry", async () => {
    await db.rewardRules.put({
      ...REWARD_RULE_COMMENT_POST,
      enabled: false,
    });
    const result = await awardPoints("m_5102", "comment_post", "s01");
    expect(result.points).toBe(0);
    expect(await ledgerFor("m_5102")).toHaveLength(0);
    expect(await growthFor("m_5102")).toHaveLength(0);
  });
});

describe("reaction_react community reward (issue #104)", () => {
  beforeEach(async () => {
    await db.open();
    await setupCommunityRewards();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("awards +1 nutrient on the first reaction per article", async () => {
    const result = await awardPoints("m_5102", "reaction_react", "s01");
    expect(result.points).toBe(1);
    expect(result.balance).toBe(1);
    const ledger = await ledgerFor("m_5102");
    expect(ledger).toHaveLength(1);
  });

  test("a second reaction on the same article does not re-award", async () => {
    await awardPoints("m_5102", "reaction_react", "s01");
    const result = await awardPoints("m_5102", "reaction_react", "s01");
    expect(result.points).toBe(0);
    expect(await ledgerFor("m_5102")).toHaveLength(1);
  });

  test("reactions on a different article reward independently", async () => {
    await awardPoints("m_5102", "reaction_react", "s01");
    const result = await awardPoints("m_5102", "reaction_react", "s05");
    expect(result.points).toBe(1);
    expect(result.balance).toBe(2);
  });

  test("disabled rule awards 0 even on the first reaction", async () => {
    await db.rewardRules.put({
      ...REWARD_RULE_REACTION_REACT,
      enabled: false,
    });
    const result = await awardPoints("m_5102", "reaction_react", "s01");
    expect(result.points).toBe(0);
    expect(await ledgerFor("m_5102")).toHaveLength(0);
  });
});

describe("submission_approved community reward (issue #104)", () => {
  beforeEach(async () => {
    await db.open();
    await setupCommunityRewards();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("awards +20 nutrients to the submitter on first approval", async () => {
    const result = await awardPoints("m_5102", "submission_approved", "sub_1");
    expect(result.points).toBe(20);
    expect(result.balance).toBe(20);
    const ledger = await ledgerFor("m_5102");
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.amount).toBe(20);
  });

  test("re-approving the same submission does not double-award", async () => {
    await awardPoints("m_5102", "submission_approved", "sub_1");
    const result = await awardPoints("m_5102", "submission_approved", "sub_1");
    expect(result.points).toBe(0);
    expect(await ledgerFor("m_5102")).toHaveLength(1);
  });

  test("approving different submissions rewards each one", async () => {
    await awardPoints("m_5102", "submission_approved", "sub_1");
    const result = await awardPoints("m_5102", "submission_approved", "sub_2");
    expect(result.points).toBe(20);
    expect(result.balance).toBe(40);
  });

  test("disabled rule awards 0 on the first approval too", async () => {
    await db.rewardRules.put({
      ...REWARD_RULE_SUBMISSION_APPROVED,
      enabled: false,
    });
    const result = await awardPoints("m_5102", "submission_approved", "sub_1");
    expect(result.points).toBe(0);
    expect(await ledgerFor("m_5102")).toHaveLength(0);
  });
});

describe("community rewards do not interact with each other (issue #104)", () => {
  beforeEach(async () => {
    await db.open();
    await setupCommunityRewards();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("commenting and reacting on the same article both reward once", async () => {
    const c = await awardPoints("m_5102", "comment_post", "s01");
    const r = await awardPoints("m_5102", "reaction_react", "s01");
    expect(c.points).toBe(3);
    expect(r.points).toBe(1);
    expect(r.balance).toBe(4);
  });

  test("disabling one rule does not block the others", async () => {
    await db.rewardRules.put({
      ...REWARD_RULE_COMMENT_POST,
      enabled: false,
    });
    const c = await awardPoints("m_5102", "comment_post", "s01");
    const r = await awardPoints("m_5102", "reaction_react", "s01");
    const s = await awardPoints("m_5102", "submission_approved", "sub_1");
    expect(c.points).toBe(0);
    expect(r.points).toBe(1);
    expect(s.points).toBe(20);
  });
});
