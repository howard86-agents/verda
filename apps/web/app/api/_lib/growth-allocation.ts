import type { prisma } from "@verda/database";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function allocateGrowth(
  tx: TxClient,
  userId: string,
  delta: number
): Promise<void> {
  if (delta <= 0) {
    return;
  }

  const config = await tx.growthConfig.findUnique({
    where: { id: "default" },
  });
  const cap = config?.maxItemsPerMember ?? 3;

  const rules = await tx.growthRule.findMany({ orderBy: { level: "asc" } });
  const lastRule = rules.at(-1);
  const maxThreshold = lastRule?.threshold ?? 300;

  let activeItem = await tx.growthItem.findFirst({
    where: { userId, completedAt: null },
    orderBy: { sequence: "desc" },
  });

  if (!activeItem) {
    const itemCount = await tx.growthItem.count({ where: { userId } });
    if (itemCount >= cap) {
      return;
    }
    activeItem = await tx.growthItem.create({
      data: { userId, nutrients: 0, level: 1, sequence: itemCount + 1 },
    });
  }

  let remaining = delta;
  let currentItem = activeItem;

  while (remaining > 0) {
    const newNutrients = currentItem.nutrients + remaining;
    if (newNutrients >= maxThreshold) {
      const overflow = newNutrients - maxThreshold;
      await tx.growthItem.update({
        where: { id: currentItem.id },
        data: {
          nutrients: maxThreshold,
          level: lastRule?.level ?? 4,
          completedAt: new Date(),
        },
      });
      remaining = overflow;

      const itemCount = await tx.growthItem.count({ where: { userId } });
      if (itemCount >= cap || remaining <= 0) {
        break;
      }
      currentItem = await tx.growthItem.create({
        data: {
          userId,
          nutrients: 0,
          level: 1,
          sequence: itemCount + 1,
        },
      });
    } else {
      const newLevel = levelFor(newNutrients, rules);
      await tx.growthItem.update({
        where: { id: currentItem.id },
        data: { nutrients: newNutrients, level: newLevel },
      });
      remaining = 0;
    }
  }
}

export function levelFor(
  nutrients: number,
  rules: Array<{ level: number; threshold: number }>
): number {
  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const rule of sorted) {
    if (nutrients >= rule.threshold) {
      return rule.level;
    }
  }
  return 1;
}
