import type { GrowthRule, PointLedger } from "./db";

export function levelFor(nutrients: number, rules: GrowthRule[]): number {
  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const rule of sorted) {
    if (nutrients >= rule.threshold) {
      return rule.level;
    }
  }
  return 1;
}

export function balanceFromLedger(entries: PointLedger[]): number {
  if (entries.length === 0) {
    return 0;
  }
  // The last entry's balanceAfter is the current balance
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted[0].balanceAfter;
}
