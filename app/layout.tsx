/**
 * Praeco root layout - classical fonts + editorial antiquity shell.
 * Derived from Circle's arc-nanopayments reference (Apache-2.0).
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Metadata } from "next";
import { Fraunces, Newsreader, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Atmosphere } from "@/components/site/atmosphere";
import { Onboarding } from "@/components/site/onboarding";
import { MobileDock } from "@/components/site/mobile-dock";
import { UserSearch } from "@/components/site/user-search";
import { Toaster } from "sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Praeco · paid for every retelling",
  description:
    "A per-read nanopayment toll booth for creators, settled in USDC on Arc. The crier is paid each time the work is carried.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Praeco · paid by the read, not the month",
    description:
      "Sell an article for a cent, paid instantly in USDC on Arc. No subscription, no floor. The lepton, reborn.",
    url: defaultUrl,
    siteName: "Praeco",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Praeco" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Praeco · paid by the read, not the month",
    description:
      "Sell an article for a cent, paid instantly in USDC on Arc. No subscription, no floor.",
    images: ["/og.png"],
    site: "@heypraeco",
  },
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  display: "swap",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});
const newsreader = Newsreader({
  variable: "--font-newsreader",
  display: "swap",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const mono = Geist_Mono({
  variable: "--font-mono-geist",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('praeco-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${newsreader.variable} ${mono.variable} antialiased`}
      >
        <Atmosphere />
        <div className="relative z-10 pb-16 md:pb-0">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
        <MobileDock />
        <Onboarding />
        <UserSearch />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
