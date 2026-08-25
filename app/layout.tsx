import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const themeInitializer = `(() => {
  try {
    const savedTheme = localStorage.getItem("track-my-worth-theme");
    const theme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();`;

export const metadata: Metadata = {
  title: {
    default: "Track My Worth - Track Your Wealth & Investments",
    template: "%s | Track My Worth",
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
  authors: [{ name: "Track My Worth" }],
  creator: "Track My Worth",
  applicationName: "Track My Worth",
  icons: {
    icon: [{ url: "/track-my-worth-mark.svg", type: "image/svg+xml" }],
    shortcut: "/track-my-worth-mark.svg",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Track My Worth",
    title: "Track My Worth - Track Your Wealth & Investments",
    description:
      "Track your net worth, savings, and investment portfolio in one simple dashboard. Monitor cash accounts, stocks, and see your wealth grow over time.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Track My Worth Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track My Worth - Track Your Wealth & Investments",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        {adsenseClient?.startsWith("ca-pub-") && (
          <script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
