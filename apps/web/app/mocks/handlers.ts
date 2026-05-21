import { HttpResponse, http } from "msw";
import { db } from "@/lib/db";

export const handlers = [
  http.get("/api/stories", async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";
    const cat = url.searchParams.get("cat");
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") ?? "latest";
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "6");

    let articles = await db.articles.where("kind").equals(kind).toArray();

    if (cat && cat !== "All") {
      articles = articles.filter((a) => a.cat === cat);
    }
    if (tag) {
      articles = articles.filter((a) => a.tag === tag);
    }

    if (sort === "popular") {
      articles.sort((a, b) => b.read - a.read);
    } else if (sort === "recommended") {
      // Shuffle deterministically by id for demo
      articles.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      // latest — by date descending (string compare works for "May DD" format)
      articles.sort((a, b) => b.date.localeCompare(a.date));
    }

    const total = articles.length;
    const start = (page - 1) * limit;
    const paged = articles.slice(start, start + limit);

    return HttpResponse.json({
      items: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
];
