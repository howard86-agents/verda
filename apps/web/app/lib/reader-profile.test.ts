import { describe, expect, test } from "bun:test";
import type { Article, GrowthItem, GrowthRule, Member } from "./db";
import {
  composePublicReaderProfile,
  pickActiveGrowthItem,
  READER_KINDS,
} from "./reader-profile";

const RULES: GrowthRule[] = [
  { level: 1, name: "Seed", jp: "種", threshold: 0 },
  { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
  { level: 3, name: "Bloom", jp: "花", threshold: 150 },
  { level: 4, name: "Fully grown", jp: "結実", threshold: 300 },
];

function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    id: "m_5102",
    name: "Hana Watanabe",
    email: "hana.w@example.com",
    joined: "Joined April 2024",
    ...overrides,
  };
}

function growthFixture(overrides: Partial<GrowthItem> = {}): GrowthItem {
  return {
    memberId: "m_5102",
    nutrients: 60,
    level: 2,
    sequence: 1,
    createdAt: "2025-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function articleFixture(overrides: Partial<Article> = {}): Article {
  return {
    id: "r04",
    slug: "small-bento-long-train",
    kind: "submission",
    cat: "",
    tag: "reader",
    title: "A small bento on a long train",
    jp: "",
    sum: "",
    img: "linear-gradient(135deg, #f1dec0, #a07a3a)",
    imagePrompt: "",
    imageSeed: 504,
    read: 0,
    date: "6d",
    author: "",
    submittedBy: "m_5102",
    status: "published",
    ...overrides,
  };
}

describe("READER_KINDS", () => {
  test("matches the SOCIAL kinds shipped from @verda/data", () => {
    expect(READER_KINDS.has("submission")).toBe(true);
    expect(READER_KINDS.has("repost")).toBe(true);
    expect(READER_KINDS.has("remix")).toBe(true);
    expect(READER_KINDS.has("brand")).toBe(false);
  });
});

describe("pickActiveGrowthItem()", () => {
  test("returns undefined when the member has no growth items", () => {
    expect(pickActiveGrowthItem([])).toBeUndefined();
  });

  test("returns the only item when the member has one plant", () => {
    const item = growthFixture();
    expect(pickActiveGrowthItem([item])).toEqual(item);
  });

  test("returns the newest non-completed item by sequence", () => {
    const oldDone = growthFixture({
      sequence: 1,
      completedAt: "2025-04-01T00:00:00.000Z",
    });
    const newActive = growthFixture({ sequence: 2 });
    expect(pickActiveGrowthItem([oldDone, newActive])).toBe(newActive);
  });

  test("falls back to the newest item when every plant is completed", () => {
    const first = growthFixture({
      sequence: 1,
      completedAt: "2025-04-01T00:00:00.000Z",
    });
    const second = growthFixture({
      sequence: 2,
      completedAt: "2025-04-15T00:00:00.000Z",
    });
    expect(pickActiveGrowthItem([first, second])).toBe(second);
  });
});

describe("composePublicReaderProfile() — privacy contract (issue #103)", () => {
  test("returns null when the member does not exist", () => {
    const profile = composePublicReaderProfile({
      member: undefined,
      growthItems: [],
      growthRules: RULES,
      articles: [],
    });
    expect(profile).toBeNull();
  });

  test("returns null when the member is soft-deleted", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture({ deletedAt: "2025-05-10T00:00:00.000Z" }),
      growthItems: [growthFixture()],
      growthRules: RULES,
      articles: [articleFixture()],
    });
    expect(profile).toBeNull();
  });

  test("never exposes email through the public payload type", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture({ email: "secret@example.com" }),
      growthItems: [growthFixture()],
      growthRules: RULES,
      articles: [articleFixture()],
    });
    expect(profile).not.toBeNull();
    if (!profile) {
      return;
    }
    // The runtime check: the email value is not embedded anywhere in
    // the JSON-serialisable payload, even via accidental dumb spreads.
    expect(JSON.stringify(profile)).not.toContain("secret@example.com");
    // And the type-level surface keeps email out of `member`.
    expect(Object.keys(profile.member).sort()).toEqual(
      ["id", "joined", "name"].sort()
    );
  });

  test("never exposes nutrient counts through the public payload type", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [growthFixture({ nutrients: 87 })],
      growthRules: RULES,
      articles: [articleFixture()],
    });
    expect(profile).not.toBeNull();
    if (!profile) {
      return;
    }
    expect(JSON.stringify(profile)).not.toContain('"nutrients"');
    expect(profile.growth?.level).toBe(2);
    // Plant name + JP label render but the raw nutrient count never does.
    expect(profile.growth?.name).toBe("Sprout");
  });
});

describe("composePublicReaderProfile() — composition", () => {
  test("includes display name and join date from the member row", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture({
        name: "Renji Park",
        joined: "Joined May 2024",
      }),
      growthItems: [],
      growthRules: RULES,
      articles: [],
    });
    expect(profile?.member.name).toBe("Renji Park");
    expect(profile?.member.joined).toBe("Joined May 2024");
  });

  test("returns growth=null when the member has no growth item yet", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [],
      growthRules: RULES,
      articles: [],
    });
    expect(profile?.growth).toBeNull();
  });

  test("returns the active growth item summary when present", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [
        growthFixture({ level: 1, sequence: 1, nutrients: 25 }),
        growthFixture({ level: 3, sequence: 2, nutrients: 5 }),
      ],
      growthRules: RULES,
      articles: [],
    });
    expect(profile?.growth?.level).toBe(3);
    expect(profile?.growth?.name).toBe("Bloom");
    expect(profile?.growth?.jp).toBe("花");
  });

  test("falls back to the Seed plant when no rule matches the level", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [growthFixture({ level: 99 })],
      growthRules: RULES,
      articles: [],
    });
    expect(profile?.growth?.name).toBe("Seed");
    expect(profile?.growth?.jp).toBe("種");
  });

  test("only shows reader-kind submissions submitted by this member", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [],
      growthRules: RULES,
      articles: [
        articleFixture({
          id: "r04",
          submittedBy: "m_5102",
          kind: "submission",
        }),
        articleFixture({
          id: "r02",
          submittedBy: "m_5102",
          kind: "repost",
        }),
        // Brand stories never appear on a reader profile, even if
        // `submittedBy` somehow points at the member.
        articleFixture({ id: "s01", submittedBy: "m_5102", kind: "brand" }),
        // Items submitted by *other* members must never leak through.
        articleFixture({
          id: "r99",
          submittedBy: "m_8201",
          kind: "submission",
        }),
      ],
    });
    expect(profile?.submissions.map((s) => s.id).sort()).toEqual(
      ["r02", "r04"].sort()
    );
  });

  test("filters out unpublished or pending submissions", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [],
      growthRules: RULES,
      articles: [
        articleFixture({ id: "r04", status: "published" }),
        articleFixture({ id: "r05", status: "pending" }),
        articleFixture({ id: "r06", status: undefined }),
      ],
    });
    expect(profile?.submissions.map((s) => s.id)).toEqual(["r04"]);
  });

  test("orders submissions newest-first by date string", () => {
    // Reader items use short relative-day strings (`2d`, `5d`, `9d`)
    // and the listing handler sorts them by `b.date.localeCompare(a.date)`,
    // i.e. descending lex compare. The composer matches that ordering
    // so the profile and the public listing stay consistent.
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [],
      growthRules: RULES,
      articles: [
        articleFixture({ id: "r04", date: "2d" }),
        articleFixture({ id: "r05", date: "9d" }),
        articleFixture({ id: "r06", date: "5d" }),
      ],
    });
    expect(profile?.submissions.map((s) => s.id)).toEqual([
      "r05",
      "r06",
      "r04",
    ]);
  });

  test("submission entries carry slug for /readers/[slug] linking", () => {
    const profile = composePublicReaderProfile({
      member: memberFixture(),
      growthItems: [],
      growthRules: RULES,
      articles: [articleFixture({ slug: "small-bento-long-train", id: "r04" })],
    });
    expect(profile?.submissions[0]?.slug).toBe("small-bento-long-train");
  });
});
