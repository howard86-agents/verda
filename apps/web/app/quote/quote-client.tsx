"use client";

import { QUOTE_CANDIDATES, type QuoteCandidate } from "@verda/data";
import { useRouter } from "next/navigation";
import { formatCcy } from "../../lib/currency";
import { ImageOrPlaceholder } from "../_components/product-image";
import { useLocale } from "../providers";

const MATCH_ID_BY_LETTER: Record<QuoteCandidate["letter"], string> = {
  A: "m1",
  B: "m2",
  C: "m3",
};

export function QuoteClient() {
  const { ccy } = useLocale();
  const router = useRouter();
  return (
    <div className="fade-in shell">
      <div className="grid grid-cols-[1.2fr_1fr] items-start gap-14 pt-12 pb-8">
        <div>
          <div className="eyebrow">
            Dossier · MSN — 04823 — delivered 14·05 09:08 GMT+8
          </div>
          <h1 className="display mt-[18px] font-normal text-[60px] leading-[0.98] tracking-[-0.02em]">
            We have located <em className="text-accent italic">three</em>
            <br />
            possible candidates.
          </h1>
          <p className="mt-[18px] max-w-[46ch] text-[14.5px] text-ink-2">
            A note from{" "}
            <span className="font-display text-ink italic">Hsiao-Yu</span>, your
            concierge — two are currently held in Paris and Hong Kong; one would
            require a private sale to release. Pricing is all-in and includes
            shipping, duties, and our service.
          </p>
        </div>
        <div className="border-[0.5px] border-line bg-paper p-6">
          <div className="row gap-[14px]">
            <div className="grid size-[52px] place-items-center rounded-full bg-ink font-display text-[22px] text-bg">
              HY
            </div>
            <div>
              <div className="display text-[18px]">Hsiao-Yu Chen</div>
              <div className="mono text-[10.5px] text-ink-3 tracking-[0.14em]">
                YOUR CONCIERGE · 11 YRS
              </div>
            </div>
          </div>
          <div className="hairline my-[18px]" />
          <div className="fine text-ink-2 leading-[1.6]">
            Replies between 09:00 — 19:00 GMT+8 · usually within 32 minutes.
          </div>
          <button
            className="btn btn-ghost mt-[18px] w-full justify-center"
            type="button"
          >
            Open LINE concierge channel
          </button>
        </div>
      </div>

      <div className="grid-3 gap-6 pb-8">
        {QUOTE_CANDIDATES.map((c) => (
          <div
            className={`card p-[22px] ${c.recommended ? "border-ink" : "border-line"}`}
            key={c.letter}
          >
            <div className="row-between">
              <div
                className={`mono text-[10px] tracking-[0.14em] ${c.recommended ? "text-accent" : "text-ink-3"}`}
              >
                {c.letter} · {c.verdict.toUpperCase()}
              </div>
              {c.recommended && (
                <div className="mono text-[10px] text-accent tracking-[0.14em]">
                  ● HOLDING
                </div>
              )}
            </div>
            <ImageOrPlaceholder
              alt={`Birkett Saddle 25 · candidate ${c.letter}`}
              aspect="4x5"
              caption={`candidate ${c.letter}`}
              id={MATCH_ID_BY_LETTER[c.letter]}
              kind="matches"
              sizes="(min-width: 1280px) 33vw, 50vw"
              style={{ marginTop: 14 }}
            />
            <div className="display mt-[14px] text-[22px] tracking-[-0.01em]">
              Birkett Saddle 25
            </div>
            <div className="muted mt-1 text-[12.5px]">{c.cond}</div>
            <div className="hairline my-[14px]" />
            <div className="grid grid-cols-2 gap-[10px] text-[12.5px]">
              <div>
                <div className="mono text-[9.5px] text-ink-3 tracking-[0.14em]">
                  SOURCE
                </div>
                <div>{c.city}</div>
              </div>
              <div>
                <div className="mono text-[9.5px] text-ink-3 tracking-[0.14em]">
                  DELIVERY
                </div>
                <div>{c.time}</div>
              </div>
            </div>
            <div className="hairline my-[14px]" />
            <div className="row-between">
              <div className="display text-[26px]">
                {formatCcy(c.price, ccy)}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => router.push("/checkout")}
                type="button"
              >
                Approve <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 pb-20">
        <div className="card-paper p-6">
          <div className="eyebrow">A note on the price</div>
          <div className="display mt-3 text-[20px] leading-[1.3]">
            Quotes are held in the source currency.
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            Should JPY soften between approval and dispatch, the saving returns
            to you in full. Should it strengthen, we absorb the difference up to
            2.5% — beyond which we pause and ask before charging.
          </p>
        </div>
        <div className="card-paper p-6">
          <div className="eyebrow">A note on authenticity</div>
          <div className="display mt-3 text-[20px] leading-[1.3]">
            Inspection happens twice — in source, and in Taipei.
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            Any piece that fails the second inspection is returned at our
            expense, and your deposit refunded the same day. We attach an
            18-image macro dossier to every dispatched file.
          </p>
        </div>
      </div>
    </div>
  );
}
