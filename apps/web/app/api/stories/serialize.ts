import type { Article } from "@verda/database";

/**
 * Wire-format article shape returned by the public stories Route
 * Handlers (issue #126). Mirrors the JSON contract the existing MSW
 * handler returns today so React Query / `fetch()` callers stay
 * unchanged when the cutover lands behind `NEXT_PUBLIC_API_MODE=real`.
 *
 * Optional fields are omitted entirely (rather than serialised as
 * `null`) when absent on the row, matching the legacy shape that the
 * Dexie-backed handler produced.
 */
export interface SerializedArticle {
  author: string;
  bodyJson?: string;
  cat: string;
  contributors?: unknown;
  date: string;
  id: string;
  imagePrompt: string;
  imageSeed: number;
  img: string;
  jp: string;
  kind: string;
  license?: string;
  publishedAt?: string;
  read: number;
  scheduledAt?: string;
  section?: string;
  series?: { name: string; ordinal: number };
  slug: string;
  sourceUrl?: string;
  src?: string;
  status?: string;
  submittedBy?: string;
  sum: string;
  tag: string;
  title: string;
}

export interface StoriesListResponse {
  items: SerializedArticle[];
  page: number;
  total: number;
  totalPages: number;
}

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return;
  }
  return value.length > 0 ? value : undefined;
}

function serializeSeries(
  raw: unknown
): { name: string; ordinal: number } | undefined {
  if (!raw || typeof raw !== "object") {
    return;
  }
  const candidate = raw as { name?: unknown; ordinal?: unknown };
  if (typeof candidate.name !== "string" || candidate.name.length === 0) {
    return;
  }
  if (typeof candidate.ordinal !== "number" || candidate.ordinal <= 0) {
    return;
  }
  return { name: candidate.name, ordinal: candidate.ordinal };
}

/**
 * Serialise a Prisma `Article` row into the public wire format. Drops
 * server-only timestamps (`createdAt`, `updatedAt`) and trims optional
 * fields whose Dexie-era counterpart was absent rather than `null`.
 */
export function serializeArticle(article: Article): SerializedArticle {
  const out: SerializedArticle = {
    id: article.id,
    slug: article.slug,
    kind: article.kind,
    cat: article.cat,
    tag: article.tag,
    title: article.title,
    jp: article.jp,
    sum: article.sum,
    img: article.img,
    imagePrompt: article.imagePrompt,
    imageSeed: article.imageSeed,
    read: article.read,
    date: article.date,
    author: article.author,
  };

  const status = trimmedString(article.status);
  if (status) {
    out.status = status;
  }
  const section = trimmedString(article.section);
  if (section) {
    out.section = section;
  }
  const series = serializeSeries(article.series);
  if (series) {
    out.series = series;
  }
  const submittedBy = trimmedString(article.submittedBy);
  if (submittedBy) {
    out.submittedBy = submittedBy;
  }
  const src = trimmedString(article.src);
  if (src) {
    out.src = src;
  }
  const sourceUrl = trimmedString(article.sourceUrl);
  if (sourceUrl) {
    out.sourceUrl = sourceUrl;
  }
  const license = trimmedString(article.license);
  if (license) {
    out.license = license;
  }
  const bodyJson = trimmedString(article.bodyJson);
  if (bodyJson) {
    out.bodyJson = bodyJson;
  }
  if (article.contributors != null) {
    out.contributors = article.contributors;
  }
  if (article.publishedAt) {
    out.publishedAt = article.publishedAt.toISOString();
  }
  if (article.scheduledAt) {
    out.scheduledAt = article.scheduledAt.toISOString();
  }

  return out;
}
