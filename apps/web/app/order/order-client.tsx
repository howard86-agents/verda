"use client";

import { ORDER_STAGES } from "@verda/data";
import { formatCcy } from "../../lib/currency";
import { ImageOrPlaceholder } from "../_components/product-image";
import { useLocale } from "../providers";

const NOTIFICATIONS: [string, boolean][] = [
  ["LINE @verda_concierge", true],
  ["Email · 陳美琳@…", true],
  ["SMS · +886 9·· ····", false],
];

export function OrderClient() {
  const { ccy } = useLocale();
  return (
    <div className="fade-in shell">
      <div className="pt-12">
        <div className="eyebrow">File MSN — 04823 · in motion</div>
        <h1 className="display mt-4 font-normal text-[56px] tracking-[-0.02em]">
          Your <em className="text-accent italic">Saddle 25</em> is travelling.
        </h1>
      </div>

      <div className="order-shell">
        <div>
          <div className="grid grid-cols-[1.2fr_1fr] gap-8 border-line border-b-[0.5px] pb-7">
            <div className="row gap-[18px]">
              <ImageOrPlaceholder
                alt="Saddle 25 · Étoupe"
                aspect="square"
                caption="piece"
                id="p1"
                kind="products"
                sizes="120px"
                style={{ width: 120, height: 120 }}
              />
              <div>
                <div className="mono text-[10px] text-accent tracking-[0.14em]">
                  BIRKETT · 2023
                </div>
                <div className="display mt-[6px] text-[26px] tracking-[-0.015em]">
                  Saddle 25 · Étoupe
                </div>
                <div className="muted mt-2 text-[13px]">
                  Candidate A · Paris 8e · approved 14 May
                </div>
                <div className="row mt-[14px] gap-2">
                  <span className="tag border-accent text-accent">
                    <span className="dot bg-accent" /> Stage 3 of 5
                  </span>
                  <span className="tag">ETA · 21 May</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mono text-[10.5px] text-ink-3 tracking-[0.14em]">
                PAID · ESCROWED
              </div>
              <div className="display mt-[6px] text-[30px]">
                {formatCcy(12_455, ccy)}
              </div>
              <div className="muted mt-1 text-[12px]">
                Released to maison on second-inspection clear.
              </div>
              <div className="process mt-5">
                <div className="seg on" />
                <div className="seg on" />
                <div className="seg cur" />
                <div className="seg" />
                <div className="seg" />
                <div className="seg" />
              </div>
            </div>
          </div>

          <div className="timeline">
            {ORDER_STAGES.map((st) => (
              <div className="stage" data-on={st.s} key={st.t}>
                <div className="marker">
                  {st.t.split(" ").slice(0, 2).join(" ")}
                  <div className="when">{st.w}</div>
                </div>
                <div>
                  <h5>{st.t}</h5>
                  <p>{st.d}</p>
                  {st.s === "cur" && (
                    <div className="line-preview mt-[14px]">
                      <strong>Hsiao-Yu</strong> · VERDA CONCIERGE
                      <br />
                      Saddle is on AF197, due Taoyuan 06:40 tomorrow. I will
                      photograph her at the vault before lunch and dispatch by
                      Wednesday — we are on track for your Friday hand-delivery
                      window.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="border-[0.5px] border-line bg-paper p-[22px]">
            <div className="row gap-[14px]">
              <div className="grid size-[42px] place-items-center rounded-full bg-ink font-display text-[18px] text-bg">
                HY
              </div>
              <div>
                <div className="display text-[16px]">Hsiao-Yu Chen</div>
                <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
                  YOUR CONCIERGE
                </div>
              </div>
            </div>
            <div className="hairline my-4" />
            <div className="fine leading-[1.7]">
              Reachable 09:00 — 19:00 GMT+8.
              <br />
              Replies in 32 mins (median).
            </div>
            <button
              className="btn btn-ghost mt-4 w-full justify-center"
              type="button"
            >
              Open LINE channel
            </button>
            <button className="btn btn-link mt-3" type="button">
              Request photographs of the piece
            </button>
          </div>

          <div className="mt-[18px] border-[0.5px] border-line bg-bg-card p-[22px]">
            <div className="mono text-[10.5px] text-ink-3 tracking-[0.14em]">
              YOUR NOTIFICATIONS
            </div>
            <div className="mt-[14px] flex flex-col gap-[10px] text-[12.5px]">
              {NOTIFICATIONS.map(([k, on]) => (
                <div className="row-between" key={k}>
                  <span>{k}</span>
                  <span
                    className={`tag ${on ? "border-positive text-positive" : "text-ink-3"}`}
                  >
                    <span
                      className={`dot ${on ? "bg-positive" : "bg-ink-3"}`}
                    />
                    {on ? "on" : "off"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[18px] border-[0.5px] border-line bg-bg-card p-[22px]">
            <div className="eyebrow">After arrival</div>
            <ul className="mx-0 mt-3 mb-0 flex list-none flex-col gap-[9px] p-0 text-[13px] text-ink-2">
              <li>— 14-day no-questions return</li>
              <li>— Resale offer · 70% within 12 months</li>
              <li>— Lifetime authentication card</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
