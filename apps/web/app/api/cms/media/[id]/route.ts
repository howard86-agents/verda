import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { deleteStoredObject } from "../storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardRole(request, "upload_media");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteStoredObject(existing.provider, existing.path);
  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
