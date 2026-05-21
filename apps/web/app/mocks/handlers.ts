import { HttpResponse, http } from "msw";
import { db } from "@/lib/db";

export const handlers = [
  http.get("/api/stories", async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";

    const articles = await db.articles.where("kind").equals(kind).toArray();
    return HttpResponse.json(articles);
  }),
];
