"use client";

import { MEMBER, ORDERS, TIERS, type Tier } from "@verda/data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TierChip } from "../_components/tier-chip";

const SIDE_NAV: [string, string][] = [
  ["orders", "Concierge files"],
  ["saved", "Saved & waitlists"],
  ["addresses", "Addresses & vaults"],
  ["payments", "Payment & escrow"],
  ["notifications", "LINE & notifications"],
  ["profile", "Profile & language"],
];

const SECTION_TITLES: Record<string, string> = {
  saved: "Saved & waitlists",
  addresses: "Addresses & vaults",
  payments: "Payment & escrow",
  notifications: "LINE & notifications",
  profile: "Profile & language",
};

const TIER_HEADLINES: Record<Tier, string> = {
  Normal: "— building file",
  Professional: "Quarterly preview unlocked",
  Diamond: "By invitation",
};

export function AccountClient() {
  const router = useRouter();
  const [page, setPage] = useState("orders");
  const [tier, setTier] = useState<Tier>("Professional");

  return (
    <div className="fade-in shell">
      <div className="pt-12">
        <div className="eyebrow">Member · since {MEMBER.joined}</div>
        <h1 className="display mt-[14px] font-normal text-[56px] leading-none tracking-[-0.02em]">
          Welcome back,{" "}
          <em className="text-accent italic">{MEMBER.firstName}</em>.
        </h1>
      </div>

      <div className="acct">
        <aside className="acct-side">
          <div className="me">
            <div className="av">ML</div>
            <div>
              <div className="display text-[17px]">{MEMBER.fullName}</div>
              <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
                {MEMBER.kanji} · {MEMBER.city}
              </div>
            </div>
          </div>

          <div className="mt-[22px] border-[0.5px] border-line bg-paper p-[14px]">
            <div className="row-between">
              <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
                CURRENT TIER
              </div>
              <TierChip tier={tier} />
            </div>
            <div
              className={`display mt-3 text-[24px] leading-none ${tier === "Diamond" ? "not-italic" : "italic"}`}
            >
              {TIER_HEADLINES[tier]}
            </div>
            <div className="fine mt-2 leading-[1.6]">
              Lifetime · {MEMBER.ledgerYtd} across {MEMBER.filesCompleted}{" "}
              files. Next review: Aug 2026.
            </div>
            <div className="mt-3 flex gap-[6px]">
              {TIERS.map((tl) => {
                const active = tier === tl;
                return (
                  <button
                    className={`flex-1 cursor-pointer appearance-none border-[0.5px] px-1 py-[6px] font-mono text-[10.5px] uppercase tracking-[0.1em] ${active ? "border-ink bg-ink text-bg" : "border-line bg-transparent text-ink-3"}`}
                    key={tl}
                    onClick={() => setTier(tl)}
                    type="button"
                  >
                    {tl[0]}
                  </button>
                );
              })}
            </div>
            <div className="fine mt-[6px] italic">preview a tier</div>
          </div>

          <nav>
            {SIDE_NAV.map(([id, label]) => (
              <button
                data-on={page === id ? "1" : "0"}
                key={id}
                onClick={() => setPage(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {page === "orders" ? (
            <div>
              <div className="row-between">
                <div>
                  <div className="eyebrow">Files · live and historical</div>
                  <div className="display mt-[10px] font-normal text-[32px] tracking-[-0.015em]">
                    Four files <em className="text-accent italic">open</em>.
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/request")}
                  type="button"
                >
                  New file <span>→</span>
                </button>
              </div>

              <div className="orders-table mt-7">
                <div className="row head">
                  <span>File</span>
                  <span>Piece</span>
                  <span>State</span>
                  <span>Value</span>
                  <span className="text-right">—</span>
                </div>
                {ORDERS.map((o) => (
                  <div className="row" key={o.id}>
                    <span className="mono text-[11px] tracking-[0.06em]">
                      {o.id}
                      <div className="text-[9.5px] text-ink-3 tracking-[0.1em]">
                        {o.date}
                      </div>
                    </span>
                    <span className="display text-[17px] tracking-[-0.01em]">
                      {o.item}
                    </span>
                    <span>
                      <span className="pill-state" data-state={o.state}>
                        {o.state}
                      </span>
                    </span>
                    <span className="numeric mono text-[12.5px]">
                      {o.value}
                    </span>
                    <span className="text-right">
                      <button
                        className="btn-link"
                        onClick={() => router.push("/order")}
                        type="button"
                      >
                        View
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-5">
                <div className="card-paper p-[22px]">
                  <div className="eyebrow">Concierge ledger · year to date</div>
                  <div className="display mt-[10px] text-[32px] tracking-[-0.015em]">
                    {MEMBER.ledgerYtd}
                  </div>
                  <div className="fine mt-1">
                    {MEMBER.filesCompleted} files completed · 0 rejected at
                    second inspection
                  </div>
                </div>
                <div className="card-paper p-[22px]">
                  <div className="eyebrow">LINE concierge channel</div>
                  <div className="display mt-[10px] text-[19px] leading-[1.3]">
                    {MEMBER.lineChannel} · {MEMBER.lineMedianReply} median reply
                  </div>
                  <div className="mt-[14px] flex gap-[10px]">
                    <button className="btn btn-ghost" type="button">
                      Open channel
                    </button>
                    <button className="btn-link" type="button">
                      Re-bind LINE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-paper mt-4 p-10">
              <div className="eyebrow">Section preview</div>
              <h2 className="display mt-3 font-normal text-[36px] tracking-[-0.015em]">
                <em className="text-accent italic">{SECTION_TITLES[page]}</em>
              </h2>
              <p className="mt-[14px] max-w-[60ch] text-[14px] text-ink-2">
                Sketched here for the prototype. The shape of this surface
                follows the same restraint — a single column, generous airline
                above the fold, no calls-to-action competing for the eye.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
