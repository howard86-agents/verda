import type { Tier } from "@verda/data";

export function TierChip({ tier }: { tier: Tier }) {
  return (
    <span className="tier-chip" data-tier={tier.toLowerCase()}>
      <span className="gem" />
      {tier}
    </span>
  );
}
