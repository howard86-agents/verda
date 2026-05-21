import "./test-setup";
import { describe, expect, test } from "bun:test";
import type { GrowthItem, GrowthRule } from "./db";
import {
  activeItemOf,
  maxThresholdFor,
  nextSequence,
  planAllocationWithDefaults,
} from "./growth-allocation";

const RULES: GrowthRule[] = [
  { level: 1, name: "Seed", jp: "種", threshold: 0 },
  { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
  { level: 3, name: "Bloom", jp: "花", threshold: 150 },
  { level: 4, name: "Fully grown", jp: "結実", threshold: 300 },
];

describe("maxThresholdFor()", () => {
  test("returns the highest threshold across all rules", () => {
    expect(maxThresholdFor(RULES)).toBe(300);
  });

  test("returns 0 for an empty rule set", () => {
    expect(maxThresholdFor([])).toBe(0);
  });
});

describe("activeItemOf() / nextSequence()", () => {
  test("returns undefined when there are no items", () => {
    expect(activeItemOf([])).toBeUndefined();
    expect(nextSequence([])).toBe(1);
  });

  test("picks the newest non-completed item by sequence", () => {
    const items: GrowthItem[] = [
      {
        id: 1,
        memberId: "m_1",
        sequence: 1,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-01T00:00:00Z",
        completedAt: "2026-05-02T00:00:00Z",
      },
      {
        id: 2,
        memberId: "m_1",
        sequence: 2,
        nutrients: 100,
        level: 2,
        createdAt: "2026-05-03T00:00:00Z",
      },
    ];
    expect(activeItemOf(items)?.id).toBe(2);
    expect(nextSequence(items)).toBe(3);
  });

  test("returns undefined when every existing item is completed", () => {
    const items: GrowthItem[] = [
      {
        id: 1,
        memberId: "m_1",
        sequence: 1,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-01T00:00:00Z",
        completedAt: "2026-05-02T00:00:00Z",
      },
    ];
    expect(activeItemOf(items)).toBeUndefined();
    expect(nextSequence(items)).toBe(2);
  });
});

describe("planAllocationWithDefaults() — first-item creation", () => {
  test("spawns the member's first growth item when none exist", () => {
    const plan = planAllocationWithDefaults(
      [],
      25,
      3,
      RULES,
      "2026-05-21T00:00:00Z"
    );
    expect(plan.allocated).toBe(25);
    expect(plan.leftover).toBe(0);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      type: "create",
      sequence: 1,
      nutrients: 25,
      level: 1,
      createdAt: "2026-05-21T00:00:00Z",
    });
  });

  test("ignores zero or negative delta", () => {
    expect(planAllocationWithDefaults([], 0, 3, RULES).steps).toEqual([]);
    expect(planAllocationWithDefaults([], -10, 3, RULES).allocated).toBe(0);
  });
});

describe("planAllocationWithDefaults() — incremental updates", () => {
  test("adds to the existing active item without creating a new one", () => {
    const items: GrowthItem[] = [
      {
        id: 7,
        memberId: "m_1",
        sequence: 1,
        nutrients: 100,
        level: 2,
        createdAt: "2026-05-01T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 25, 3, RULES);
    expect(plan.allocated).toBe(25);
    expect(plan.leftover).toBe(0);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      type: "update",
      id: 7,
      nutrients: 125,
      level: 2,
    });
  });

  test("updates the level when the new total crosses a threshold", () => {
    const items: GrowthItem[] = [
      {
        id: 7,
        memberId: "m_1",
        sequence: 1,
        nutrients: 145,
        level: 2,
        createdAt: "2026-05-01T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 10, 3, RULES);
    const step = plan.steps[0];
    expect(step).toMatchObject({ type: "update", id: 7, nutrients: 155 });
    if (step.type === "update") {
      expect(step.level).toBe(3);
    }
  });
});

describe("planAllocationWithDefaults() — completion + overflow", () => {
  test("maxing the active item completes it and seeds the next one", () => {
    const items: GrowthItem[] = [
      {
        id: 7,
        memberId: "m_1",
        sequence: 1,
        nutrients: 290,
        level: 3,
        createdAt: "2026-05-01T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(
      items,
      25,
      3,
      RULES,
      "2026-05-21T00:00:00Z"
    );
    expect(plan.allocated).toBe(25);
    expect(plan.leftover).toBe(0);
    expect(plan.steps).toHaveLength(2);

    const update = plan.steps[0];
    expect(update).toMatchObject({
      type: "update",
      id: 7,
      nutrients: 300,
      level: 4,
      completedAt: "2026-05-21T00:00:00Z",
    });

    const created = plan.steps[1];
    expect(created).toMatchObject({
      type: "create",
      sequence: 2,
      nutrients: 15,
      level: 1,
      createdAt: "2026-05-21T00:00:00Z",
    });
  });

  test("a single delta can complete one item and fully fill the next", () => {
    const items: GrowthItem[] = [
      {
        id: 7,
        memberId: "m_1",
        sequence: 1,
        nutrients: 290,
        level: 3,
        createdAt: "2026-05-01T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 320, 3, RULES);
    expect(plan.allocated).toBe(320);
    expect(plan.leftover).toBe(0);
    // active completes (10 absorbed) + new item completes (300 absorbed) +
    // a third spawns with the remaining 10.
    expect(plan.steps).toHaveLength(3);
    const create1 = plan.steps[1];
    const create2 = plan.steps[2];
    expect(create1).toMatchObject({
      type: "create",
      sequence: 2,
      nutrients: 300,
      level: 4,
    });
    if (create1.type === "create") {
      // The freshly-created item that maxes out in the same allocation
      // pass must carry its completedAt onto the persistence step so the
      // caller persists the completion (regression guard).
      expect(create1.completedAt).toBeTruthy();
    }
    expect(create2).toMatchObject({
      type: "create",
      sequence: 3,
      nutrients: 10,
      level: 1,
    });
    if (create2.type === "create") {
      expect(create2.completedAt).toBeFalsy();
    }
  });

  test("a brand-new item that maxes in one award carries completedAt on its create step", () => {
    const plan = planAllocationWithDefaults(
      [],
      300,
      3,
      RULES,
      "2026-05-21T00:00:00Z"
    );
    expect(plan.steps).toHaveLength(1);
    const step = plan.steps[0];
    expect(step.type).toBe("create");
    if (step.type === "create") {
      expect(step.nutrients).toBe(300);
      expect(step.completedAt).toBe("2026-05-21T00:00:00Z");
    }
  });
});

describe("planAllocationWithDefaults() — cap enforcement", () => {
  test("blocks new items once the cap is reached", () => {
    const items: GrowthItem[] = [
      {
        id: 1,
        memberId: "m_1",
        sequence: 1,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-01T00:00:00Z",
        completedAt: "2026-05-02T00:00:00Z",
      },
      {
        id: 2,
        memberId: "m_1",
        sequence: 2,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-03T00:00:00Z",
        completedAt: "2026-05-04T00:00:00Z",
      },
      {
        id: 3,
        memberId: "m_1",
        sequence: 3,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-05T00:00:00Z",
        completedAt: "2026-05-06T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 50, 3, RULES);
    expect(plan.allocated).toBe(0);
    expect(plan.leftover).toBe(50);
    expect(plan.steps).toEqual([]);
  });

  test("partial: completes the active item but does not spawn beyond cap", () => {
    const items: GrowthItem[] = [
      {
        id: 1,
        memberId: "m_1",
        sequence: 1,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-01T00:00:00Z",
        completedAt: "2026-05-02T00:00:00Z",
      },
      {
        id: 2,
        memberId: "m_1",
        sequence: 2,
        nutrients: 300,
        level: 4,
        createdAt: "2026-05-03T00:00:00Z",
        completedAt: "2026-05-04T00:00:00Z",
      },
      {
        id: 3,
        memberId: "m_1",
        sequence: 3,
        nutrients: 290,
        level: 3,
        createdAt: "2026-05-05T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 25, 3, RULES);
    expect(plan.allocated).toBe(10);
    expect(plan.leftover).toBe(15);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      type: "update",
      id: 3,
      nutrients: 300,
      level: 4,
    });
    if (plan.steps[0].type === "update") {
      expect(plan.steps[0].completedAt).toBeTruthy();
    }
  });

  test("cap of 1 keeps the member to a single item", () => {
    const items: GrowthItem[] = [
      {
        id: 1,
        memberId: "m_1",
        sequence: 1,
        nutrients: 290,
        level: 3,
        createdAt: "2026-05-01T00:00:00Z",
      },
    ];
    const plan = planAllocationWithDefaults(items, 100, 1, RULES);
    expect(plan.allocated).toBe(10);
    expect(plan.leftover).toBe(90);
    expect(plan.steps).toHaveLength(1);
  });

  test("cap of 0 disables growth-item allocation entirely", () => {
    const plan = planAllocationWithDefaults([], 25, 0, RULES);
    expect(plan.allocated).toBe(0);
    expect(plan.leftover).toBe(25);
    expect(plan.steps).toEqual([]);
  });
});
