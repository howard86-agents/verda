import { describe, expect, test } from "bun:test";
import { SOCIAL } from "@verda/data";
import {
  buildReaderMemberSeed,
  READER_ATTRIBUTION,
  SEEDED_READER_BEHAVIOR,
  SEEDED_READER_GROWTH,
  SEEDED_READER_LEDGER,
  SEEDED_READER_MEMBERS,
} from "./reader-seed-data";

const FIXED_NOW = "2025-05-22T00:00:00.000Z";
const GRADIENT_RE = /^linear-gradient/;
const HTTPS_URL_RE = /^https?:\/\//;
const JOINED_PREFIX_RE = /^Joined /;

/**
 * Reader-section seed coverage (issue #97).
 *
 * These tests pin the editorial commitments from issue #97 directly to
 * the seed data: ~15 reader items with real authored bodies and a
 * valid `submittedBy` member each, ~10 seeded members carrying the
 * starter ledger / growth / behavior pattern, and reposts + remixes
 * carrying the attribution fields the public reader detail surfaces.
 */

describe("SOCIAL reader-section catalogue (issue #97)", () => {
  test("has at least 15 reader items spread across all three kinds", () => {
    expect(SOCIAL.length).toBeGreaterThanOrEqual(15);
    const submissions = SOCIAL.filter((s) => s.kind === "submission");
    const reposts = SOCIAL.filter((s) => s.kind === "repost");
    const remixes = SOCIAL.filter((s) => s.kind === "remix");
    expect(submissions.length).toBeGreaterThanOrEqual(4);
    expect(reposts.length).toBeGreaterThanOrEqual(4);
    expect(remixes.length).toBeGreaterThanOrEqual(3);
  });

  test("every reader item carries a non-empty submittedBy member id", () => {
    for (const s of SOCIAL) {
      expect(s.submittedBy).toBeDefined();
      expect((s.submittedBy ?? "").length).toBeGreaterThan(0);
    }
  });

  test("every submittedBy resolves to a seeded member", () => {
    const memberIds = new Set([
      "m_4421",
      ...SEEDED_READER_MEMBERS.map((m) => m.id),
    ]);
    for (const s of SOCIAL) {
      expect(memberIds.has(s.submittedBy ?? "")).toBe(true);
    }
  });

  test("every reader item has unique id, slug, and imageSeed", () => {
    const ids = SOCIAL.map((s) => s.id);
    const slugs = SOCIAL.map((s) => s.slug);
    const seeds = SOCIAL.map((s) => s.imageSeed);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  test("every reader item carries an imagePrompt and gradient img", () => {
    for (const s of SOCIAL) {
      expect(s.imagePrompt.length).toBeGreaterThan(0);
      expect(s.img).toMatch(GRADIENT_RE);
    }
  });
});

describe("READER_ATTRIBUTION coverage (issue #97)", () => {
  test("every reader item has an attribution entry with body and license", () => {
    for (const s of SOCIAL) {
      const attr = READER_ATTRIBUTION[s.id];
      expect(attr).toBeDefined();
      expect(attr?.body.length).toBeGreaterThan(0);
      expect((attr?.license ?? "").length).toBeGreaterThan(0);
      expect((attr?.sourceUrl ?? "").length).toBeGreaterThan(0);
    }
  });

  test("reposts and remixes carry source URL, license, and contributors", () => {
    const needsAttribution = SOCIAL.filter(
      (s) => s.kind === "repost" || s.kind === "remix"
    );
    expect(needsAttribution.length).toBeGreaterThanOrEqual(8);
    for (const s of needsAttribution) {
      const attr = READER_ATTRIBUTION[s.id];
      expect(attr?.sourceUrl).toMatch(HTTPS_URL_RE);
      expect((attr?.license ?? "").length).toBeGreaterThan(0);
      expect(attr?.contributors?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test("every body has at least one paragraph of meaningful length", () => {
    for (const [id, attr] of Object.entries(READER_ATTRIBUTION)) {
      // 12 of 15 items ship multi-paragraph bodies; the original three
      // r01–r03 are short-form caption submissions and remain a single
      // paragraph by design.
      expect(attr.body.length).toBeGreaterThanOrEqual(1);
      const longest = Math.max(...attr.body.map((p) => p.length));
      expect(longest).toBeGreaterThan(60);
      // Cross-check the id is referenced by the catalogue.
      expect(SOCIAL.some((s) => s.id === id)).toBe(true);
    }
  });
});

describe("SEEDED_READER_MEMBERS pool (issue #97)", () => {
  test("seeds at least ten members beyond the logged-in MEMBER", () => {
    expect(SEEDED_READER_MEMBERS.length).toBeGreaterThanOrEqual(10);
  });

  test("every member has a unique id, name, email, and join date", () => {
    const ids = SEEDED_READER_MEMBERS.map((m) => m.id);
    const emails = SEEDED_READER_MEMBERS.map((m) => m.email);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(emails).size).toBe(emails.length);
    for (const m of SEEDED_READER_MEMBERS) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.joined).toMatch(JOINED_PREFIX_RE);
    }
  });

  test("every member ships starter ledger, growth, and behavior rows", () => {
    const ledgerIds = new Set(SEEDED_READER_LEDGER.map((l) => l.memberId));
    const growthIds = new Set(SEEDED_READER_GROWTH.map((g) => g.memberId));
    const behaviorIds = new Set(SEEDED_READER_BEHAVIOR.map((b) => b.memberId));
    for (const m of SEEDED_READER_MEMBERS) {
      expect(ledgerIds.has(m.id)).toBe(true);
      expect(growthIds.has(m.id)).toBe(true);
      expect(behaviorIds.has(m.id)).toBe(true);
    }
  });
});

describe("buildReaderMemberSeed() (issue #97)", () => {
  test("produces ledger, growth, and behavior arrays sized to members", () => {
    const seed = buildReaderMemberSeed(FIXED_NOW);
    expect(seed.pointLedger.length).toBe(SEEDED_READER_MEMBERS.length);
    expect(seed.growthItems.length).toBe(SEEDED_READER_MEMBERS.length);
    expect(seed.behaviorLogs.length).toBe(SEEDED_READER_MEMBERS.length);
  });

  test("propagates the seed-time timestamp into every row", () => {
    const seed = buildReaderMemberSeed(FIXED_NOW);
    for (const row of seed.pointLedger) {
      expect(row.createdAt).toBe(FIXED_NOW);
    }
    for (const row of seed.growthItems) {
      expect(row.createdAt).toBe(FIXED_NOW);
    }
    for (const row of seed.behaviorLogs) {
      expect(row.createdAt).toBe(FIXED_NOW);
    }
  });

  test("growth items default to the first plant in the member's sequence", () => {
    const seed = buildReaderMemberSeed(FIXED_NOW);
    for (const item of seed.growthItems) {
      expect(item.sequence).toBe(1);
      expect(item.level).toBeGreaterThanOrEqual(1);
    }
  });

  test("ledger balanceAfter mirrors the seeded amount (single-row members)", () => {
    const seed = buildReaderMemberSeed(FIXED_NOW);
    for (const row of seed.pointLedger) {
      expect(row.balanceAfter).toBe(row.amount);
    }
  });
});
