import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../_lib/guard-role";
import {
  conflict,
  invalid,
  isUniqueConflict,
  slugify,
} from "../_lib/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_taxonomy");
  if (denied) {
    return denied;
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_taxonomy");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Partial<{ id: string; name: string }>;
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return invalid("name required");
  }

  const name = body.name.trim();
  const id = body.id?.trim() || slugify(name);
  try {
    const category = await prisma.category.create({ data: { id, name } });
    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    if (isUniqueConflict(error)) {
      return conflict("Category already exists");
    }
    throw error;
  }
}
