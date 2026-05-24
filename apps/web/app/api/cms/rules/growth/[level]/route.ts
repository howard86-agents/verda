import { guardRole } from "../../../../_lib/guard-role";
import { updateGrowthRule } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ level: string }>;
}

export async function PUT(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  const { level } = await params;
  const body = (await request.json()) as Partial<{
    jp: string;
    name: string;
    threshold: number;
  }>;
  return updateGrowthRule(Number.parseInt(level, 10), body);
}
