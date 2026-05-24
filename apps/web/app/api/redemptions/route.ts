/**
 * POST /api/redemptions — redeem a completed growth item (issue #132).
 *
 * Eligibility rules mirror the in-browser MSW handler:
 *   - the growth item must exist and belong to the caller
 *   - it must be completed (`completedAt` set)
 *   - it must not be redeemed already (`redeemedAt` unset)
 *
 * The redemption row + the `growthItem.redeemedAt|redemptionId` patch
 * are written inside a single Prisma `$transaction`. The
 * `redemptions.growthItemId` unique index is the storage-level
 * double-redeem guard so two concurrent POSTs cannot both succeed.
 */
import { prisma } from "@verda/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RedemptionBody {
  growthItemId?: number;
  memberId?: string;
  userId?: string;
}

interface MockReward {
  displayName: string;
  expiresAt: Date;
  fulfillmentRef: string | null;
  provider: string;
  rewardCode: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function redemptionId(): string {
  return `red_${crypto.randomUUID().replaceAll("-", "")}`;
}

function mockRewardFor(sequence: number, now: Date): MockReward {
  const padded = String(sequence).padStart(2, "0");
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 30);
  return {
    provider: "mock",
    rewardCode: `VERDA-PLANT-${padded}`,
    displayName: `Plant ${padded} reward`,
    fulfillmentRef: null,
    expiresAt,
  };
}

function serializeRedemption(redemption: {
  createdAt: Date;
  displayName: string | null;
  expiresAt: Date | null;
  fulfillmentRef: string | null;
  growthItemId: number;
  growthItemSequence: number;
  id: string;
  metadata: unknown;
  provider: string;
  rewardCode: string;
  userId: string;
}) {
  return {
    id: redemption.id,
    memberId: redemption.userId,
    growthItemId: redemption.growthItemId,
    growthItemSequence: redemption.growthItemSequence,
    createdAt: redemption.createdAt.toISOString(),
    provider: redemption.provider,
    rewardCode: redemption.rewardCode,
    displayName: redemption.displayName ?? undefined,
    expiresAt: redemption.expiresAt?.toISOString(),
    fulfillmentRef: redemption.fulfillmentRef,
    metadata: redemption.metadata ?? undefined,
  };
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as RedemptionBody;
  const userId = body.userId ?? body.memberId;
  const growthItemId = body.growthItemId;

  if (!(userId && Number.isInteger(growthItemId))) {
    return NextResponse.json(
      { error: "memberId and growthItemId required" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.growthItem.findUnique({
        where: { id: growthItemId },
      });

      if (!item || item.userId !== userId) {
        return { error: "not_found" as const };
      }
      if (!item.completedAt) {
        return { error: "not_completed" as const };
      }
      if (item.redeemedAt) {
        return { error: "already_redeemed" as const };
      }

      const now = new Date();
      const reward = mockRewardFor(item.sequence, now);
      const created = await tx.redemption.create({
        data: {
          id: redemptionId(),
          userId,
          growthItemId: item.id,
          growthItemSequence: item.sequence,
          provider: reward.provider,
          rewardCode: reward.rewardCode,
          displayName: reward.displayName,
          expiresAt: reward.expiresAt,
          fulfillmentRef: reward.fulfillmentRef,
        },
      });

      await tx.growthItem.update({
        where: { id: item.id },
        data: { redeemedAt: now, redemptionId: created.id },
      });

      return { redemption: created };
    });

    if ("error" in result) {
      const status = result.error === "not_found" ? 404 : 409;
      return NextResponse.json(
        { error: "Redemption rejected", reason: result.error },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      redemption: serializeRedemption(result.redemption),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Redemption rejected", reason: "duplicate_redemption_record" },
        { status: 409 }
      );
    }
    throw error;
  }
}
