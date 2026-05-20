"use client";

import type { Product } from "@verda/data";
import Link from "next/link";
import { formatCcy } from "../../lib/currency";
import { useLocale } from "../providers";
import { ImageOrPlaceholder } from "./product-image";

export function ProductCard({ product }: { product: Product }) {
  const { ccy } = useLocale();
  return (
    <Link className="prod" href={`/product/${product.id}`}>
      <ImageOrPlaceholder
        alt={`${product.house} ${product.name}`}
        aspect="4x5"
        caption={`${product.house.toLowerCase()} · ${product.id}`}
        id={product.id}
        kind="products"
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
      />
      <div className="prod-meta">
        <div className="prod-house">{product.house}</div>
        <div className="prod-name">{product.name}</div>
        <div className="prod-foot">
          <div className="prod-price">{formatCcy(product.price, ccy)}</div>
          <div
            className={`prod-status ${product.stockType === "estimated" ? "estim" : ""}`}
          >
            <span className="dot" />
            {product.stockType === "estimated" ? "estimated" : "in vault"}
          </div>
        </div>
      </div>
    </Link>
  );
}
