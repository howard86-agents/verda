import type { ReactNode } from "react";
import { Footer } from "@/_components/footer";
import { TopNav } from "@/_components/top-nav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
