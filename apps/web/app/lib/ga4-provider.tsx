"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initGA4, trackPageView } from "./ga4";

export function GA4Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initGA4();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
