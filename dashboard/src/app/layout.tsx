import type { Metadata } from "next";
import { EB_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  title: "Orichalcos — Risk-management protocol for autonomous AI trading strategies",
  description:
    "Strategies stay sealed. Capital stays safe. Every trade is verifiable. The first on-chain insurance primitive for AI trading agents — sealed inside 0G Compute TEE, executing on Hyperliquid testnet, with drawdown breach enforcement on 0G Chain.",
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
        </Providers>
      </body>
    </html>
  );
}
