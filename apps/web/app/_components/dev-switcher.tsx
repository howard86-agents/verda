"use client";

import { usePathname, useRouter } from "next/navigation";

const STEPS: { href: string; label: string; match: (p: string) => boolean }[] =
  [
    { href: "/", label: "Home", match: (p) => p === "/" },
    {
      href: "/collection",
      label: "Collection",
      match: (p) => p.startsWith("/collection"),
    },
    {
      href: "/product/p1",
      label: "Detail",
      match: (p) => p.startsWith("/product"),
    },
    {
      href: "/request",
      label: "Request",
      match: (p) => p.startsWith("/request"),
    },
    { href: "/quote", label: "Quote", match: (p) => p.startsWith("/quote") },
    {
      href: "/checkout",
      label: "Checkout",
      match: (p) => p.startsWith("/checkout"),
    },
    { href: "/order", label: "Order", match: (p) => p.startsWith("/order") },
    {
      href: "/account",
      label: "Account",
      match: (p) => p.startsWith("/account"),
    },
  ];

export function DevSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="switcher">
      {STEPS.map((s) => (
        <button
          data-on={s.match(pathname) ? "1" : "0"}
          key={s.href}
          onClick={() => router.push(s.href)}
          type="button"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
