import Dexie, { type EntityTable } from "dexie";

export interface Article {
  author: string;
  bodyJson?: string;
  cat: string;
  date: string;
  id: string;
  imagePrompt: string;
  imageSeed: number;
  img: string;
  jp: string;
  kind: string;
  publishedAt?: string;
  read: number;
  scheduledAt?: string;
  slug: string;
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
  /** 1-based per-member display order: Plant 01, Plant 02, … */
  sequence?: number;
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

export { db };
