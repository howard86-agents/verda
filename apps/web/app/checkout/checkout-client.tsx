"use client";

import { PAYMENT_METHODS } from "@verda/data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCcy } from "../../lib/currency";
import { ImageOrPlaceholder } from "../_components/product-image";
import { useLocale } from "../providers";

const CONSENTS: [string, boolean][] = [
  [
    "I confirm the piece matches my brief — and accept the concierge has discretion within the approved budget.",
    true,
  ],
  [
    "I authorise VERDA to authenticate before dispatch; failed inspections refund in full.",
    true,
  ],
  ["Send LINE updates from @verda_concierge at each milestone.", true],
  ["Hold my address on file for repeat carriage (encrypted at rest).", false],
];

export function CheckoutClient() {
  const { ccy } = useLocale();
  const router = useRouter();
  const [method, setMethod] = useState<"card" | "ecpay" | "line">("card");

  return (
    <div className="fade-in shell">
      <div className="pt-12 pb-4">
        <div className="eyebrow">File MSN — 04823 · Candidate A · Paris</div>
        <h1 className="display mt-[14px] font-normal text-[52px] tracking-[-0.02em]">
          Approve & <span className="text-accent italic">secure</span>.
        </h1>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-14 pt-8 pb-20">
        <div className="stack-lg">
          <div>
            <div className="eyebrow">01 · Delivery</div>
            <div className="hairline mt-3" />
            <div className="row-between border-line border-b-[0.5px] py-[18px]">
              <div>
                <div className="display text-[19px] tracking-[-0.01em]">
                  Chen Mei-Lin · 陳美琳
                </div>
                <div className="muted mt-1 text-[12.5px]">
                  No. 7, Lane 12, Lishui Street · Da&apos;an District · Taipei
                  106 · TW
                  <span className="ml-[14px] text-accent">· primary</span>
                </div>
              </div>
              <button className="btn-link" type="button">
                Change
              </button>
            </div>
            <div className="row-between py-[18px]">
              <div>
                <div className="mono text-[10.5px] text-ink-3 tracking-[0.14em]">
                  CARRIAGE
                </div>
                <div className="mt-[6px] text-[14px]">
                  Hand-delivered · Wed 21 May · 14:00 – 18:00 window
                </div>
              </div>
              <button className="btn-link" type="button">
                Re-time
              </button>
            </div>
          </div>

          <div>
            <div className="eyebrow">02 · Payment</div>
            <div className="hairline mt-3" />
            <div className="grid grid-cols-3 gap-[14px] py-[18px]">
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    className={`cursor-pointer border-[0.5px] p-[18px] text-left ${active ? "border-ink bg-bg-card" : "border-line bg-paper"}`}
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    type="button"
                  >
                    <div className="display text-[19px] tracking-[-0.01em]">
                      {m.name}
                    </div>
                    <div className="muted mt-1 text-[11.5px]">{m.sub}</div>
                    <div className="mt-[10px] flex gap-[6px]">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          className="h-[14px] w-[22px] rounded-[1.5px] bg-bg-soft"
                          key={i}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 grid grid-cols-[2fr_1fr_1fr] gap-5">
              <div className="field">
                <label htmlFor="card-number">Card number</label>
                <input id="card-number" placeholder="4242  4242  4242  4242" />
              </div>
              <div className="field">
                <label htmlFor="card-expiry">Expiry</label>
                <input id="card-expiry" placeholder="05 / 29" />
              </div>
              <div className="field">
                <label htmlFor="card-cvc">CVC</label>
                <input id="card-cvc" placeholder="•••" />
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">03 · Consents</div>
            <div className="hairline mt-3" />
            <div className="flex flex-col gap-[14px] py-5 text-[13.5px] text-ink-2">
              {CONSENTS.map(([copy, on]) => (
                <label
                  className="flex cursor-pointer items-start gap-[14px]"
                  key={copy}
                >
                  <input
                    className="pointer-events-none absolute size-px opacity-0"
                    defaultChecked={on}
                    type="checkbox"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-[2px] grid size-4 shrink-0 place-items-center rounded-[2px] border-[0.5px] border-ink-3 text-[10px] text-bg ${on ? "bg-ink" : "bg-transparent"}`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {copy}
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="sticky top-24 self-start border-[0.5px] border-line bg-paper p-7">
          <h4 className="mx-0 mt-0 mb-[14px] font-mono text-[10.5px] text-ink-3 uppercase tracking-[0.16em]">
            Order summary
          </h4>
          <div className="row gap-[14px]">
            <ImageOrPlaceholder
              alt="Birkett Saddle 25 · Étoupe"
              aspect="none"
              caption="A"
              id="p1"
              kind="products"
              sizes="78px"
              style={{ width: 78, height: 96 }}
            />
            <div>
              <div className="mono text-[10px] text-accent tracking-[0.14em]">
                BIRKETT · 2023
              </div>
              <div className="display mt-1 text-[17px] leading-[1.15]">
                Saddle 25 · Étoupe
              </div>
              <div className="muted mt-[6px] text-[11.5px]">
                Candidate A · Paris 8e
              </div>
            </div>
          </div>
          <div className="mt-[22px] flex flex-col gap-[10px] border-line border-t-[0.5px] pt-[18px] text-[12.5px]">
            <div className="row-between">
              <span className="muted">Piece</span>
              <span>{formatCcy(11_760, ccy)}</span>
            </div>
            <div className="row-between">
              <span className="muted">Concierge service</span>
              <span>{formatCcy(480, ccy)}</span>
            </div>
            <div className="row-between">
              <span className="muted">Authentication</span>
              <span>{formatCcy(120, ccy)}</span>
            </div>
            <div className="row-between">
              <span className="muted">Insured carriage</span>
              <span>{formatCcy(95, ccy)}</span>
            </div>
            <div className="row-between">
              <span className="muted">Duty (paid)</span>
              <span className="muted">included</span>
            </div>
          </div>
          <div className="hairline my-5" />
          <div className="row-between">
            <span className="mono text-[10.5px] text-ink-3 tracking-[0.16em]">
              TOTAL TODAY
            </span>
            <span className="display text-[30px]">
              {formatCcy(12_455, ccy)}
            </span>
          </div>
          <div className="fine mt-1">
            Held in escrow until vault inspection · refunded if rejected.
          </div>
          <button
            className="btn btn-primary mt-[22px] w-full justify-center"
            onClick={() => router.push("/order")}
            type="button"
          >
            Authorise · {formatCcy(12_455, ccy)} <span>→</span>
          </button>
          <div className="fine mt-[14px] text-center leading-[1.6]">
            256-bit · Stripe · escrowed in TWD
          </div>
        </aside>
      </div>
    </div>
  );
}
