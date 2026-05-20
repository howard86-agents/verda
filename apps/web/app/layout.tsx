import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, JetBrains_Mono } from "next/font/google";
import { DevSwitcher } from "./_components/dev-switcher";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--ff-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VERDA · Concierge",
  description:
    "A private concierge for sourcing fine leather, watchmaking and ready-to-wear.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const isDev = process.env.NODE_ENV !== "production";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${cormorant.variable} ${geist.variable} ${mono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script src="/theme-init.js" />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            {isDev && <DevSwitcher />}
          </div>
        </Providers>
      </body>
    </html>
  );
}
