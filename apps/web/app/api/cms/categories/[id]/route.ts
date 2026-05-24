import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import {
  conflict,
  invalid,
  isMissingRecord,
  isUniqueConflict,
  notFound,
} from "../../_lib/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "manage_taxonomy");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  return category ? NextResponse.json(category) : notFound();
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
    const nextName = body.name.trim();
    const category = await prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id } });
      if (!current) {
        return null;
      }

      const updated = await tx.category.update({
        where: { id },
        data: { name: nextName },
      });

      if (current.name !== updated.name) {
        await tx.article.updateMany({
          where: { cat: current.name },
          data: { cat: updated.name },
        });
      }

      return updated;
    });
    if (!category) {
      return notFound();
    }
    return NextResponse.json(category);
  } catch (error: unknown) {
    if (isMissingRecord(error)) {
      return notFound();
    }
    if (isUniqueConflict(error)) {
      return conflict("Category already exists");
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
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ ok: true });
  }

  const refs = await prisma.article.count({ where: { cat: category.name } });
  if (refs > 0) {
    return conflict(
      `Cannot delete: ${refs} article(s) use this category. Reassign them first.`
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
