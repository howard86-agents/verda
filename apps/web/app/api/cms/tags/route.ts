import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../_lib/guard-role";
import { invalid, slugify } from "../_lib/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags);
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
  const tag = await prisma.tag.create({ data: { id, name } });
  return NextResponse.json(tag, { status: 201 });
}
