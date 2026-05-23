import { NextResponse } from "next/server";
import { writeLocalUpload } from "../../cms/media/storage";

export async function PUT(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  try {
    const payload = await writeLocalUpload(token, await request.arrayBuffer());
    return NextResponse.json({ ok: true, path: payload.path });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
