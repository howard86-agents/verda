import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { growthPayload, updateGrowthConfig, updateGrowthRule } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  return NextResponse.json(await growthPayload());
}

export async function PUT(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Partial<{
    config: { maxItemsPerMember?: number };
    rules: Array<{
      jp?: string;
      level: number;
      name?: string;
      threshold?: number;
    }>;
  }>;

  if (body.config) {
    const configRes = await updateGrowthConfig(body.config);
    if (!configRes.ok) {
      return configRes;
    }
  }

  for (const rule of body.rules ?? []) {
    const ruleRes = await updateGrowthRule(rule.level, rule);
    if (!ruleRes.ok) {
      return ruleRes;
    }
  }

  return NextResponse.json(await growthPayload());
}
