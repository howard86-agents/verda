import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { localPathFor } from "../../../../cms/media/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const objectPath = path.map(decodeURIComponent).join("/");

  try {
    const data = await readFile(localPathFor(objectPath));
    return new Response(data, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
