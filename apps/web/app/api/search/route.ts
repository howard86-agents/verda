import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";

// Full-text search — `GET /api/search` (issue #128).
//
// Ranked ILIKE search across title, summary, tag, section name, and
// body. Weights mirror the MSW handler: title ×10 (prefix +20),
// summary ×5, tag ×4, section ×4, body ×1. Only published articles
// are searched.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

interface SearchHitRow {
  cat: string;
  date: string;
  id: string;
  kind: string;
  matchedFields: string[];
  score: number;
  section: string | null;
  slug: string;
  sum: string;
  tag: string;
  title: string;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT))
  );

  if (!q) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const where: Prisma.ArticleWhereInput = {
    status: "published",
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { sum: { contains: q, mode: "insensitive" } },
      { tag: { contains: q, mode: "insensitive" } },
      { section: { contains: q, mode: "insensitive" } },
      { bodyJson: { contains: q, mode: "insensitive" } },
    ],
  };

  const candidates = await prisma.article.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      sum: true,
      tag: true,
      kind: true,
      cat: true,
      section: true,
      date: true,
      bodyJson: true,
    },
  });

  const sections = await prisma.section.findMany();
  const sectionNameById = new Map(sections.map((s) => [s.id, s.name]));

  const hits = scoreAll(candidates, q, sectionNameById);
  const limited = hits.slice(0, limit);
  return NextResponse.json({ items: limited, total: limited.length });
}

interface CandidateRow {
  bodyJson: string | null;
  cat: string;
  date: string;
  id: string;
  kind: string;
  section: string | null;
  slug: string;
  sum: string;
  tag: string;
  title: string;
}

function scoreAll(
  candidates: CandidateRow[],
  query: string,
  sectionNameById: Map<string, string>
): SearchHitRow[] {
  const qLower = query.toLowerCase();
  const hits: SearchHitRow[] = [];

  for (const row of candidates) {
    const hit = scoreOne(row, qLower, sectionNameById);
    if (hit) {
      hits.push(hit);
    }
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.date.localeCompare(a.date);
  });

  return hits;
}

function scoreOne(
  row: CandidateRow,
  qLower: string,
  sectionNameById: Map<string, string>
): SearchHitRow | null {
  let score = 0;
  const matchedFields: string[] = [];

  const titleLower = row.title.toLowerCase();
  const titleHits = countOccurrences(titleLower, qLower);
  if (titleHits > 0) {
    score += titleHits * 10;
    matchedFields.push("title");
    if (titleLower.startsWith(qLower)) {
      score += 20;
    }
  }

  const sumHits = countOccurrences(row.sum.toLowerCase(), qLower);
  if (sumHits > 0) {
    score += sumHits * 5;
    matchedFields.push("summary");
  }

  const tagHits = countOccurrences(row.tag.toLowerCase(), qLower);
  if (tagHits > 0) {
    score += tagHits * 4;
    matchedFields.push("tag");
  }

  const sectionName = row.section
    ? (sectionNameById.get(row.section) ?? row.section)
    : "";
  const sectionHits = countOccurrences(sectionName.toLowerCase(), qLower);
  if (sectionHits > 0) {
    score += sectionHits * 4;
    matchedFields.push("section");
  }

  const bodyText = flattenBodyJson(row.bodyJson ?? undefined);
  const bodyHits = countOccurrences(bodyText.toLowerCase(), qLower);
  if (bodyHits > 0) {
    score += bodyHits * 1;
    matchedFields.push("body");
  }

  if (score === 0) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sum: row.sum,
    tag: row.tag,
    kind: row.kind,
    cat: row.cat,
    section: row.section,
    date: row.date,
    score,
    matchedFields,
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!(haystack && needle)) {
    return 0;
  }
  let count = 0;
  let from = 0;
  while (true) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      break;
    }
    count++;
    from = at + needle.length;
  }
  return count;
}

function flattenBodyJson(bodyJson: string | undefined): string {
  if (!bodyJson) {
    return "";
  }
  try {
    return walk(JSON.parse(bodyJson)).trim();
  } catch {
    return "";
  }
}

function walk(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") {
    return n.text;
  }
  if (Array.isArray(n.content)) {
    return (n.content as unknown[]).map(walk).join(" ");
  }
  return "";
}
