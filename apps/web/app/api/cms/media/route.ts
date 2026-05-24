import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../_lib/guard-role";
import { deleteStoredObject } from "./storage";

export async function GET() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    assets.map((asset) => ({
      id: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      alt: asset.alt,
      createdAt: asset.createdAt.toISOString(),
      url: asset.url,
    }))
  );
}

export async function POST(request: Request) {
  const denied = await guardRole(request, "upload_media");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Partial<{
    alt: string;
    filename: string;
    id: string;
    mimeType: string;
    path: string;
    provider: string;
    url: string;
  }>;
  if (!(body.filename && body.mimeType && body.path && body.url)) {
    return NextResponse.json(
      { error: "filename, mimeType, path and url are required" },
      { status: 400 }
    );
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      id: body.id,
      filename: body.filename,
      mimeType: body.mimeType,
      path: body.path,
      provider: body.provider || "local",
      url: body.url,
      alt: body.alt || "",
    },
  });

  return NextResponse.json(
    {
      id: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      alt: asset.alt,
      createdAt: asset.createdAt.toISOString(),
      url: asset.url,
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const denied = await guardRole(request, "upload_media");
  if (denied) {
    return denied;
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteStoredObject(existing.provider, existing.path);
  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
