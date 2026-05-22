import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { createSignedUpload } from "../storage";

export async function POST(request: Request) {
  const denied = await guardRole(request, "upload_media");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Partial<{
    filename: string;
    mimeType: string;
  }>;
  if (!(body.filename && body.mimeType)) {
    return NextResponse.json(
      { error: "filename and mimeType are required" },
      { status: 400 }
    );
  }
  if (!body.mimeType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported" },
      { status: 400 }
    );
  }

  try {
    const signed = await createSignedUpload({
      filename: body.filename,
      mimeType: body.mimeType,
    });
    return NextResponse.json(signed);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not sign upload",
      },
      { status: 500 }
    );
  }
}
