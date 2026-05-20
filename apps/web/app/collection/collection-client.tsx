"use client";

import { PRODUCTS, type Product } from "@verda/data";
import Link from "next/link";
import { useState } from "react";
import { CCY } from "../../lib/currency";
import { TRANSLATIONS } from "../../lib/translations";
import { ProductCard } from "../_components/product-card";
import { useLocale } from "../providers";

type Filter = "all" | "vault" | "estimated";

const CATEGORIES = [
  "Leather",
  "Watches",
  "Jewellery",
  "Ready-to-wear",
  "Vintage",
];

export function CollectionClient() {
  const { ccy, lang } = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const filterStock: Record<Filter, Product["stockType"] | null> = {
    all: null,
    vault: "in-vault",
    estimated: "estimated",
  };
  const targetStock = filterStock[filter];
  const filtered = targetStock
    ? PRODUCTS.filter((p) => p.stockType === targetStock)
    : PRODUCTS;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fade-in">
      <div className="shell pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="eyebrow">The Collection · Spring 2026</div>
            <h1 className="display mt-4 text-[64px] leading-none tracking-[-0.02em]">
              Eighty-two pieces
              <br />
              currently <span className="text-accent italic">open to file</span>
              .
            </h1>
          </div>
          <div className="max-w-[320px] text-[13.5px] text-ink-2">
            Every figure converts at{" "}
            <span className="mono">{CCY[ccy].sym}</span> ·
            <span className="mono"> 1 USD = {CCY[ccy].rate}</span> ·
            <span className="muted"> updated 09:42 GMT+8</span>.
          </div>
        </div>
      </div>

      <div className="shell pb-6">
        <div className="hairline" />
        <div className="row-between flex-wrap gap-[14px] py-5">
          <div className="row flex-wrap gap-2">
            {(
              [
                ["all", "All pieces", 82],
                ["vault", "In vault", 41],
                ["estimated", "On quote", 41],
              ] as const
            ).map(([id, label, n]) => {
              const active = filter === id;
              return (
                <button
                  className={`tag cursor-pointer ${active ? "border-ink-2 bg-bg-card text-ink" : "border-line bg-paper text-ink-3"}`}
                  data-on={active ? "1" : "0"}
                  key={id}
                  onClick={() => setFilter(id)}
                  type="button"
                >
                  {active && <span className="dot" />}
                  {label} · <span className="text-ink-3">{n}</span>
                </button>
              );
            })}
            <span className="mono ml-[18px] text-[10px] text-ink-3 tracking-[0.14em]">
              CATEGORIES —
            </span>
            {CATEGORIES.map((c) => (
              <span className="tag cursor-pointer" key={c}>
                {c}
              </span>
            ))}
          </div>
          <div className="row">
            <span className="mono text-[10px] text-ink-3 tracking-[0.14em]">
              SORT
            </span>
            <select
              aria-label="Sort collection"
              className="input-sm pr-7"
              defaultValue="newest"
            >
              <option value="newest">Newest dossier</option>
              <option value="asc">Price ascending</option>
              <option value="desc">Price descending</option>
              <option value="fav">Concierge favourites</option>
            </select>
          </div>
        </div>
        <div className="hairline" />
      </div>

      <div className="shell pt-9 pb-20">
        <div className="grid-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-14 border-[0.5px] border-line bg-paper p-8">
          <div className="grid grid-cols-[1.4fr_1fr] items-center gap-8">
            <div>
              <div className="eyebrow">Nothing quite fits.</div>
              <h3 className="display mt-[14px] font-normal text-[32px] tracking-[-0.015em]">
                Send us a photo, a link, or simply{" "}
                <em className="text-accent italic">describe it.</em>
              </h3>
              <p className="mt-3 mb-0 text-ink-2">
                One concierge will respond within 36 hours with sourcing options
                and a transparent quote.
              </p>
            </div>
            <div className="text-right">
              <Link className="btn btn-primary" href="/request">
                {t.cta.request} <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
