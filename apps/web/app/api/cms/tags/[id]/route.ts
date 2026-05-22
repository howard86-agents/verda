import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { invalid, notFound } from "../../_lib/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: Params
): Promise<Response> {
  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  return tag ? NextResponse.json(tag) : notFound();
}

export async function PUT(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "manage_taxonomy");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const body = (await request.json()) as Partial<{ name: string }>;
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return invalid("name required");
  }

  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: { name: body.name.trim() },
    });
    return NextResponse.json(tag);
  } catch (error: unknown) {
    if (isMissingRecord(error)) {
      return notFound();
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "manage_taxonomy");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return NextResponse.json({ ok: true });
  }

  const refs = await prisma.article.count({ where: { tag: tag.name } });
  if (refs > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: ${refs} article(s) use this tag. Reassign them first.`,
      },
      { status: 409 }
    );
  }

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function isMissingRecord(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}
