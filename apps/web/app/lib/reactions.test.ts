import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "./db";
import { getReactionState, toggleReaction } from "./reactions";

describe("reactions helpers (issue #90)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("getReactionState returns zero counts on an article with no reactions", async () => {
    const state = await getReactionState({ articleId: "s01" });
    expect(state.counts).toEqual({ grew: 0, learned: 0, loved: 0 });
    expect(state.mine).toEqual({ grew: 0, learned: 0, loved: 0 });
  });

  test("toggleReaction creates the row on first call", async () => {
    const result = await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "loved",
    });
    expect(result.active).toBe(true);
    expect(result.counts.loved).toBe(1);
    expect(result.mine.loved).toBe(1);
  });

  test("toggleReaction removes the row on second call", async () => {
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "loved",
    });
    const result = await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "loved",
    });
    expect(result.active).toBe(false);
    expect(result.counts.loved).toBe(0);
    expect(result.mine.loved).toBe(0);
  });

  test("counts roll up across members and kinds", async () => {
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "grew",
    });
    await toggleReaction({
      articleId: "s01",
      memberId: "m_6033",
      kind: "grew",
    });
    await toggleReaction({
      articleId: "s01",
      memberId: "m_7188",
      kind: "loved",
    });
    const state = await getReactionState({
      articleId: "s01",
      memberId: "m_5102",
    });
    expect(state.counts).toEqual({ grew: 2, learned: 0, loved: 1 });
    expect(state.mine).toEqual({ grew: 1, learned: 0, loved: 0 });
  });

  test("a member can hold one of each kind on the same article", async () => {
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "grew",
    });
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "learned",
    });
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "loved",
    });
    const state = await getReactionState({
      articleId: "s01",
      memberId: "m_5102",
    });
    expect(state.counts).toEqual({ grew: 1, learned: 1, loved: 1 });
    expect(state.mine).toEqual({ grew: 1, learned: 1, loved: 1 });
  });

  test("counts are scoped to the article id", async () => {
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "grew",
    });
    await toggleReaction({
      articleId: "s02",
      memberId: "m_5102",
      kind: "loved",
    });
    const a = await getReactionState({ articleId: "s01" });
    const b = await getReactionState({ articleId: "s02" });
    expect(a.counts).toEqual({ grew: 1, learned: 0, loved: 0 });
    expect(b.counts).toEqual({ grew: 0, learned: 0, loved: 1 });
  });

  test("mine is zero when caller doesn't pass memberId", async () => {
    await toggleReaction({
      articleId: "s01",
      memberId: "m_5102",
      kind: "grew",
    });
    const state = await getReactionState({ articleId: "s01" });
    expect(state.counts.grew).toBe(1);
    expect(state.mine.grew).toBe(0);
  });
});
