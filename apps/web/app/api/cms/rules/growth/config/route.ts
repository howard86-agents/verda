import { guardRole } from "../../../../_lib/guard-role";
import { updateGrowthConfig } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Partial<{ maxItemsPerMember: number }>;
  return updateGrowthConfig(body);
}
