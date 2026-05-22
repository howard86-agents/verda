import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { publicVisibilityWhere } from "../_lib/visibility";
import { type StoriesListResponse, serializeArticle } from "./serialize";

// Public stories listing — `GET /api/stories` (issue #126).
//
// Backed by Postgres via Prisma; the response shape and query-param
// surface matches the existing MSW handler so React Query callers
// (`apps/web/app/(site)/stories/page.tsx`) round-trip unchanged when
// `NEXT_PUBLIC_API_MODE=real` flips MSW out of the way.
//
// Pinning to the Node runtime keeps Prisma's PrismaPg adapter happy
// (it relies on `pg`'s TCP transport, not the Edge runtime). Marking
// the route dynamic prevents Next from trying to statically optimise
// it during build — the listing depends on live DB rows and request
// query params.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 6;
const DEFAULT_PAGE = 1;

function intParam(raw: string | null, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "brand";
  const cat = url.searchParams.get("cat");
  const section = url.searchParams.get("section");
  const tag = url.searchParams.get("tag");
  const sort = url.searchParams.get("sort") ?? "latest";
  const page = intParam(url.searchParams.get("page"), DEFAULT_PAGE);
  const limit = intParam(url.searchParams.get("limit"), DEFAULT_LIMIT);

  const where: Prisma.ArticleWhereInput = {
    kind,
    ...publicVisibilityWhere(),
  };
  if (cat && cat !== "All") {
    where.cat = cat;
  }
  if (section) {
    where.section = section;
  }
  if (tag) {
    where.tag = tag;
  }

  // `latest` sorts by the human-readable `date` string descending —
  // the same string-compare the MSW handler uses today, which is fine
  // for the "May 18" / "May 16" format the seeded brand stories ship.
  // `popular` sorts by total reads; `recommended` is a deterministic
  // by-id shuffle so the demo response is stable.
  const orderBy: Prisma.ArticleOrderByWithRelationInput = (() => {
    if (sort === "popular") {
      return { read: "desc" };
    }
    if (sort === "recommended") {
      return { id: "asc" };
    }
    return { date: "desc" };
  })();

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  const body: StoriesListResponse = {
    items: items.map(serializeArticle),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
  return NextResponse.json(body);
}
