"use client";

import type { ReactNode } from "react";
import { DevTools } from "@/_components/dev-tools";
import { Footer } from "@/_components/footer";
import { TopNav } from "@/_components/top-nav";
import { WebViewFooter, WebViewHeader } from "@/_components/webview-chrome";
import { useWebView } from "@/lib/use-webview";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const isWebView = useWebView();

  if (isWebView) {
    return (
      <div className="env-safe flex min-h-screen flex-col bg-cream">
        <WebViewHeader />
        <main className="flex-1 px-safe">{children}</main>
        <WebViewFooter />
        <DevTools />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <DevTools />
    </div>
  );
}
