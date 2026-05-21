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
  email: string;
  id: string;
  joined: string;
  name: string;
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

export interface GrowthItem {
  id?: number;
  level: number;
  memberId: string;
  nutrients: number;
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

export interface MediaAsset {
  alt: string;
  blob: Blob;
  createdAt: string;
  filename: string;
  focalPoint?: { x: number; y: number };
  id: string;
  mimeType: string;
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
  mediaAssets: EntityTable<MediaAsset, "id">;
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
});

export { db };
