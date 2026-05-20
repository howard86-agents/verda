import "./globals.css";
import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Shippori_Mincho,
} from "next/font/google";
import { Providers } from "./providers";

const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--ff-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-mono",
  display: "swap",
});

// Japanese faces — large; don't preload, used only for CJK glyph coverage.
const notoSansJp = Noto_Sans_JP({
  weight: ["400", "500"],
  variable: "--ff-jp-sans",
  display: "swap",
  preload: false,
});

const notoSerifJp = Noto_Serif_JP({
  weight: ["400", "500", "700"],
  variable: "--ff-jp-serif",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Verda · Story Center · 故事中心",
  description:
    "A multimedia story center — brand stories, reader submissions, and a growable garden of nutrient points.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${shippori.variable} ${inter.variable} ${mono.variable} ${notoSansJp.variable} ${notoSerifJp.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script src="/theme-init.js" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
