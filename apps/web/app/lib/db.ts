import Dexie, { type EntityTable } from "dexie";

export interface ArticleContributor {
  /** Optional accent color used to tint contributor list entries. */
  color?: string;
  /** Display name (e.g. handle, byline). */
  name: string;
  /** Short note describing what the contributor provided. */
  role?: string;
}

export interface Article {
  author: string;
  bodyJson?: string;
  cat: string;
  /** Optional list of contributors for reposts / remixes (issue #75). */
  contributors?: ArticleContributor[];
  date: string;
  id: string;
  imagePrompt: string;
  imageSeed: number;
  img: string;
  jp: string;
  kind: string;
  /** Optional license label (e.g. "CC BY-NC 4.0"). */
  license?: string;
  publishedAt?: string;
  read: number;
  scheduledAt?: string;
  slug: string;
  /** Public URL for the original source. */
  sourceUrl?: string;
  /** Original source label (handle, publication, …). */
  src?: string;
  status?: string;
  sum: string;
  tag: string;
  title: string;
}

export interface Member {
  deletedAt?: string;
  email: string;
  id: string;
  joined: string;
  name: string;
}

export interface AuditLog {
  action: "point_adjust" | "member_delete";
  adminId: string;
  amount?: number;
  balanceAfter?: number;
  balanceBefore?: number;
  createdAt: string;
  id?: number;
  memberId: string;
  reason: string;
}

export interface BehaviorLog {
  action: string;
  articleId?: string;
  createdAt: string;
  id?: number;
  memberId: string;
}

export interface PointLedger {
  amount: number;
  balanceAfter: number;
  createdAt: string;
  id?: number;
  memberId: string;
  reason: string;
}

/**
 * A single growth item ("Plant 0N") in a member's collection.
 *
 * Members hold up to `growthConfig.maxItemsPerMember` items concurrently
 * (issue #67). At any point one item is "active" — the newest one with
 * `completedAt` unset — and receives nutrients from rewards/positive
 * admin adjustments. When its nutrients reach the highest growth-rule
 * threshold it is marked completed and the overflow seeds the next item,
 * provided the cap has not been reached.
 *
 * Once completed, an item becomes redeemable (issue #35); after redemption
 * the item stays in the collection (kept, not consumed) and gains a
 * `redeemedAt` timestamp plus the `redemptionId` of the row in the
 * `redemptions` table.
 *
 * `sequence` is a 1-based index per member used for display ("Plant 01",
 * "Plant 02", …) and to disambiguate items with identical timestamps.
 */
export interface GrowthItem {
  /** ISO timestamp when this item was first allocated. */
  completedAt?: string;
  /** ISO timestamp when this item was first allocated. */
  createdAt?: string;
  id?: number;
  level: number;
  memberId: string;
  nutrients: number;
  /** ISO timestamp the item was redeemed (issue #35). */
  redeemedAt?: string;
  /** FK to the `redemptions.id` row that recorded this redemption. */
  redemptionId?: string;
  /** 1-based per-member display order: Plant 01, Plant 02, … */
  sequence?: number;
}

/**
 * Reward provider tag (issue #35). Starts mocked; the real fulfillment
 * targets (coupon, 91APP, external) plug in behind the same payload shape.
 */
export type RedemptionProvider = "mock" | "coupon" | "91app" | "external";

/**
 * A redemption record — created when a member redeems a fully-grown
 * growth item (issue #35). Per-member, per-`growthItemId`; duplicates
 * for the same growth item are rejected by the API.
 *
 * The reward fields here mirror the future fulfillment payload shape so
 * the UI and analytics surface stay stable as the provider switches
 * from `mock` to a real coupon / 91APP / external integration.
 */
export interface Redemption {
  createdAt: string;
  /** Optional user-facing reward title. */
  displayName?: string;
  /** Optional ISO timestamp when the reward expires. */
  expiresAt?: string;
  /** Optional external/coupon/91APP reference. Null/unset for the mock. */
  fulfillmentRef?: string | null;
  /** The completed growth item this redemption is for. */
  growthItemId: number;
  /** Snapshot of the item's display sequence at redemption time. */
  growthItemSequence: number;
  id: string;
  memberId: string;
  /** Optional provider-specific JSON-safe details. */
  metadata?: Record<string, unknown>;
  provider: RedemptionProvider;
  /** Mocked or real reward code, e.g. "VERDA-PLANT-01". */
  rewardCode: string;
}

export interface Collection {
  articleId: string;
  createdAt: string;
  id?: number;
  memberId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface RewardRule {
  action: string;
  enabled: boolean;
  id: string;
  limitType: string;
  points: number;
}

export interface GrowthRule {
  jp: string;
  level: number;
  name: string;
  threshold: number;
}

/**
 * Per-deployment growth configuration. Currently exposes the
 * growth-item quantity cap (養成物數量上限) as a single keyed row
 * (`id: "default"`). The product-decision name is `maxGrowthItems`
 * (default `3`); we keep the storage column `maxItemsPerMember` from
 * issue #30 so existing data round-trips, and treat the two names as
 * aliases. Enforcement of the cap lives in the multi-collectible growth
 * model (issue #67).
 */
export interface GrowthConfig {
  id: string;
  /**
   * Product alias: `maxGrowthItems`. Default `3`.
   */
  maxItemsPerMember: number;
}

export const GROWTH_CONFIG_DEFAULT_ID = "default";
export const GROWTH_CONFIG_DEFAULT_MAX_ITEMS = 3;

export interface MediaAsset {
  alt: string;
  blob: Blob;
  createdAt: string;
  filename: string;
  focalPoint?: { x: number; y: number };
  id: string;
  mimeType: string;
}

export interface ArticleVersion {
  articleId: string;
  bodyJson: string;
  editor: string;
  id: string;
  status: string;
  summary: string;
  timestamp: string;
}

/**
 * A flat, live, public comment posted by a signed-in member on an
 * article (issue #89). Comments are listed newest-first and post live
 * (no pre-moderation, per the agreed trust model). Removal happens later
 * via the CMS comment-moderation slice (#101); this surface only
 * supports create + list + soft-removal flag for forward compat.
 */
export interface Comment {
  /** ID of the article the comment is attached to. */
  articleId: string;
  /** ISO timestamp the comment was posted. */
  createdAt: string;
  /** Stable id (unique). */
  id: string;
  /** Member-id of the author. */
  memberId: string;
  /** Display-name snapshot taken at post time so a member rename can't
   *  retroactively rewrite history; the public reader uses this as-is. */
  memberName: string;
  /** Marker set when CMS moderation removes the comment (#101). */
  removedAt?: string;
  /** Plain-text comment body. Bodies are short and unformatted in this
   *  slice; rich-text comments aren't a goal for #89. */
  text: string;
}

const db = new Dexie("verda") as Dexie & {
  articles: EntityTable<Article, "id">;
  members: EntityTable<Member, "id">;
  behaviorLogs: EntityTable<BehaviorLog, "id">;
  pointLedger: EntityTable<PointLedger, "id">;
  growthItems: EntityTable<GrowthItem, "id">;
  collections: EntityTable<Collection, "id">;
  categories: EntityTable<Category, "id">;
  tags: EntityTable<Tag, "id">;
  rewardRules: EntityTable<RewardRule, "id">;
  growthRules: EntityTable<GrowthRule, "level">;
  growthConfig: EntityTable<GrowthConfig, "id">;
  mediaAssets: EntityTable<MediaAsset, "id">;
  articleVersions: EntityTable<ArticleVersion, "id">;
  auditLog: EntityTable<AuditLog, "id">;
  redemptions: EntityTable<Redemption, "id">;
  comments: EntityTable<Comment, "id">;
};

db.version(1).stores({
  articles: "id, slug, kind, cat, tag, status",
  members: "id, email",
  behaviorLogs:
    "++id, memberId, action, articleId, [memberId+action+articleId]",
  pointLedger: "++id, memberId",
  growthItems: "++id, memberId",
  collections: "++id, memberId, articleId, [memberId+articleId]",
  categories: "id, name",
  tags: "id, name",
  rewardRules: "id, action",
  growthRules: "level",
  mediaAssets: "id, filename, mimeType",
  articleVersions: "id, articleId, timestamp",
});

// v2 — additive on the v1 schema. Combines:
//   - issue #30: growthConfig table (growth-item quantity cap, storage-only;
//     enforcement lives in #67)
//   - issue #31: auditLog table (point_adjust + member_delete trail) and a
//     deletedAt index on members so the active list can filter on it
db.version(2).stores({
  growthConfig: "id",
  members: "id, email, deletedAt",
  auditLog: "++id, memberId, action, createdAt",
});

// v3 — issue #67: multi-collectible growth.
// Adds an explicit per-member ordering index for growth items so the
// "Plant 01 / Plant 02 / …" sequence is queryable, and backfills the
// new GrowthItem fields (`sequence`, `createdAt`) on existing rows so
// they migrate cleanly as the member's first plant.
db.version(3)
  .stores({
    growthItems: "++id, memberId, [memberId+sequence]",
  })
  .upgrade(async (tx) => {
    const now = new Date().toISOString();
    await tx
      .table<GrowthItem>("growthItems")
      .toCollection()
      .modify((item) => {
        if (item.sequence == null) {
          item.sequence = 1;
        }
        if (item.createdAt == null) {
          item.createdAt = now;
        }
      });
  });

// v4 — issue #35: growth-item redemption.
// Adds the `redemptions` table indexed by member and growth item, with a
// uniqueness index on `growthItemId` so duplicate redemption attempts for
// the same item are rejected at the storage layer too. The new optional
// fields on GrowthItem (`redeemedAt`, `redemptionId`) are additive and
// don't need their own indexes.
db.version(4).stores({
  redemptions: "id, memberId, &growthItemId, createdAt",
});

// v5 — issue #89: flat live comments on articles.
// Adds the `comments` table indexed by article + creation time so the
// public reader can fetch newest-first comments per article without a
// full scan. Indexed on memberId too so the future moderation surface
// (#101) can pull all comments by an author.
db.version(5).stores({
  comments: "id, articleId, memberId, createdAt",
});

export { db };
