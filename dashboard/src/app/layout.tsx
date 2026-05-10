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
  title: "Orichalcos — Trainers, not depositors. Apprentices, not vaults.",
  description:
    "A verifiable alternative to the unverifiable signal economy. Every signal sealed in hardware before publication, content-addressed in 0G Storage, bound to an on-chain identity that cannot be reset.",
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
