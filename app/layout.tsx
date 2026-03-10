import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://trackmyworth.xyz";

export const metadata: Metadata = {
  title: {
    default: "Net Worth Tracker - Track Your Wealth & Investments | TrackMyWorth",
    template: "%s | TrackMyWorth",
  },
  description:
    "Track your net worth, savings, and investment portfolio in one simple dashboard. Monitor cash accounts, stocks, and see your wealth grow over time with live price updates.",
  keywords: [
    "net worth tracker",
    "wealth tracking",
    "investment portfolio",
    "personal finance",
    "FIRE calculator",
    "savings tracker",
    "portfolio tracker",
    "financial dashboard",
  ],
  authors: [{ name: "TrackMyWorth" }],
  creator: "TrackMyWorth",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "TrackMyWorth",
    title: "Net Worth Tracker - Track Your Wealth & Investments",
    description:
      "Track your net worth, savings, and investment portfolio in one simple dashboard. Monitor cash accounts, stocks, and see your wealth grow over time.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrackMyWorth - Net Worth Tracker Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Net Worth Tracker - Track Your Wealth & Investments",
    description:
      "Track your net worth, savings, and investment portfolio in one simple dashboard.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
