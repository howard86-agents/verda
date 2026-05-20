"use client";

import type { Product } from "@verda/data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCcy } from "../../../lib/currency";
import { TRANSLATIONS } from "../../../lib/translations";
import { ImageOrPlaceholder } from "../../_components/product-image";
import { useLocale } from "../../providers";

export function ProductClient({ product }: { product: Product }) {
  const { lang, ccy } = useLocale();
  const router = useRouter();
  const [thumb, setThumb] = useState(0);
  const t = TRANSLATIONS[lang];

  const houseTitle =
    product.house.charAt(0) + product.house.slice(1).toLowerCase();

  return (
    <div className="fade-in shell">
      <div className="py-6 font-mono text-[10.5px] text-ink-3 uppercase tracking-[0.14em]">
        <Link className="text-inherit" href="/">
          Atelier
        </Link>
        <span className="mx-[10px]">/</span>
        <Link className="text-inherit" href="/collection">
          The Collection
        </Link>
        <span className="mx-[10px]">/</span>
        <span className="text-ink">
          {product.house} · {product.name}
        </span>
      </div>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <button
                aria-label={`View ${i + 1}`}
                aria-pressed={thumb === i}
                className="ph cursor-pointer"
                data-on={thumb === i ? "1" : "0"}
                data-ph={`v${i + 1}`}
                key={i}
                onClick={() => setThumb(i)}
                type="button"
              />
            ))}
          </div>
          <ImageOrPlaceholder
            alt={`${product.house} ${product.name} · view ${thumb + 1}`}
            aspect="4x5"
            brackets
            caption={`${product.house.toLowerCase()} · view ${thumb + 1}`}
            className="pdp-hero"
            id={product.id}
            kind="products"
            priority
            sizes="(min-width: 1280px) 50vw, 100vw"
            style={{ minHeight: 620 }}
          />
        </div>
        <div>
          <div className="house">{product.house}</div>
          <h1 className="mt-[10px]">{product.name}</h1>
          <div className="muted text-[13px]">
            Sourced from {houseTitle} maison, Faubourg Saint-Honoré · Paris.
          </div>

          <div className="price-row">
            <span>{formatCcy(product.price, ccy)}</span>
            <span className="alt mono">
              ≈ {formatCcy(product.price, "USD")} · live FX 09:42
            </span>
          </div>

          <div className="row mt-[18px] flex-wrap gap-[10px]">
            <span
              className={`tag ${product.stockType === "in-vault" ? "border-positive text-positive" : ""}`}
            >
              <span
                className={`dot ${product.stockType === "in-vault" ? "bg-positive" : "bg-accent"}`}
              />
              {product.stockType === "in-vault"
                ? "In Taipei vault · ready to ship"
                : "On concierge quote · est. 4–6 weeks"}
            </span>
            <span className="tag">
              Authenticated · Card #{product.id.toUpperCase()}-2607
            </span>
          </div>

          <div className="specs">
            {(
              [
                ["Maison", houseTitle],
                ["Reference", `${product.id.toUpperCase()} · 2024 production`],
                [
                  "Materials",
                  "Togo calfskin, palladium hardware, contrast saddle stitch",
                ],
                ["Dimensions", "25 × 18 × 14 cm · 720g"],
                [
                  "Provenance",
                  "First owner, hand-carried Paris → Taipei, full set",
                ],
                [
                  "Authentication",
                  "Photographic dossier · 18 macro images on request",
                ],
                ["Ships from", "Taipei · within 48 hours of confirmed payment"],
              ] as const
            ).map(([k, v]) => (
              <div className="row" key={k}>
                <div className="k">{k}</div>
                <div>{v}</div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => router.push("/checkout")}
              type="button"
            >
              {t.cta.addToBag} <span>→</span>
            </button>
            <Link className="btn btn-ghost" href={`/request?ref=${product.id}`}>
              {t.cta.requestPiece}
            </Link>
          </div>

          <div className="assurance">
            <div className="item">
              <div className="seal">✦</div>
              <div className="copy">
                <strong>Lifetime authentication</strong>
                <span>
                  Two-stage inspection in our Taipei vault before dispatch.
                </span>
              </div>
            </div>
            <div className="item">
              <div className="seal">⌖</div>
              <div className="copy">
                <strong>Escrowed payment</strong>
                <span>
                  Funds held until you confirm the piece in your hands.
                </span>
              </div>
            </div>
            <div className="item">
              <div className="seal">○</div>
              <div className="copy">
                <strong>Insured carriage</strong>
                <span>Hand-delivered with signature; flat fee at Diamond.</span>
              </div>
            </div>
            <div className="item">
              <div className="seal">↺</div>
              <div className="copy">
                <strong>Resale offer</strong>
                <span>
                  We buy back any sourced piece at fair-value, any time.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
