import type { ReactNode } from "react";
import { DevTools } from "@/_components/dev-tools";
import { Footer } from "@/_components/footer";
import { TopNav } from "@/_components/top-nav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <DevTools />
    </div>
  );
}
