import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { integerOrNull, invalid, notFound } from "../_lib/route-utils";

export async function growthPayload(): Promise<{
  config: { id: string; maxItemsPerMember: number };
  rules: Array<{ jp: string; level: number; name: string; threshold: number }>;
}> {
  const [rules, config] = await Promise.all([
    prisma.growthRule.findMany({ orderBy: { level: "asc" } }),
    prisma.growthConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", maxItemsPerMember: 3 },
    }),
  ]);

  return { rules, config };
}

export async function updateGrowthRule(
  level: number,
  body: Partial<{ jp: string; name: string; threshold: number }>
): Promise<Response> {
  if (!Number.isFinite(level)) {
    return invalid("Invalid level");
  }

  const existing = await prisma.growthRule.findUnique({ where: { level } });
  if (!existing) {
    return notFound();
  }

  const threshold = integerOrNull(body.threshold);
  const rule = await prisma.growthRule.update({
    where: { level },
    data: {
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.jp === "string" ? { jp: body.jp } : {}),
      ...(threshold === null ? {} : { threshold }),
    },
  });
  return NextResponse.json(rule);
}

export async function updateGrowthConfig(
  body: Partial<{ maxItemsPerMember: number }>
): Promise<Response> {
  const maxItemsPerMember = integerOrNull(body.maxItemsPerMember);
  if (maxItemsPerMember === null) {
    return invalid("maxItemsPerMember must be a non-negative number");
  }

  const config = await prisma.growthConfig.upsert({
    where: { id: "default" },
    update: { maxItemsPerMember },
    create: { id: "default", maxItemsPerMember },
  });
  return NextResponse.json(config);
}
