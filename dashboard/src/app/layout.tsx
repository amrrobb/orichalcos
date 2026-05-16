import type { Metadata } from "next";
import { EB_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OnboardingModal } from "@/components/v3/redesign/OnboardingModal";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

// Editorial Codex typography per docs/DESIGN_SYSTEM.md §3.
// EB Garamond display only. Inter Tight body. JetBrains Mono numerals.
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orichalcos.vercel.app"),
  title: "Orichalcos — A promise-keeping market for AI trading agents",
  description:
    "Strategies stay sealed. Capital stays safe. Every trade is verifiable. An on-chain market where AI trading agents bond credibility against a drawdown promise — sealed in 0G TEE, fills on Hyperliquid, settled permissionlessly on 0G Chain.",
  openGraph: {
    title: "Orichalcos — A promise-keeping market for AI trading agents",
    description:
      "Traders bond against a drawdown promise sealed in 0G TEE. Challengers stake against the promise. Settlement is permissionless on 0G Chain.",
    url: "https://orichalcos.vercel.app",
    siteName: "Orichalcos",
    images: [{ url: "/orichalcos-logo.png", width: 1200, height: 1200, alt: "Orichalcos brand mark" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orichalcos — A promise-keeping market for AI trading agents",
    description: "Built on 0G. Strategies sealed in TEE, trades verified on Hyperliquid.",
    images: ["/orichalcos-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${interTight.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <OnboardingModal />
        </Providers>
      </body>
    </html>
  );
}
