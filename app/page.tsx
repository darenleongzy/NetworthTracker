import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3, Heart } from "lucide-react";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
} from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Track My Worth - Monitor Your Wealth & FIRE Goals",
  description:
    "Track your net worth, savings, and investments in one dashboard. See your portfolio value with live stock prices, monitor cash accounts, and watch your wealth grow over time.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-bold">
            <Image className="shrink-0" src="/track-my-worth-mark.svg" alt="" width={28} height={28} priority />
            <span className="truncate text-base sm:text-xl">Track My Worth</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href="/features" className="hidden sm:block">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="px-2 sm:px-3">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button className="px-3 sm:px-4">Sign up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-5 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="max-w-4xl text-[clamp(2.35rem,10vw,4rem)] font-bold leading-[1.05] tracking-tight">
            Track Your <span className="text-primary">Net Worth</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Monitor your savings, investments, and overall financial health in
            one simple dashboard. See how your wealth grows over time.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">Sign up</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="px-5 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-semibold">
              See Your Finances at a Glance
            </h2>
            {/* Browser-style frame */}
            <div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                  trackmyworth.xyz/dashboard
                </div>
              </div>
              {/* Screenshot container */}
              <div className="relative aspect-[16/9] bg-muted">
                <Image
                  src="/dashboard-preview.png"
                  alt="Track My Worth Dashboard Preview"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Track cash accounts, stock portfolios, and see your net worth grow over time.
            </p>
          </div>
        </section>

        <section className="border-t px-5 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Visual Dashboard</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Charts and graphs showing your net worth growth, asset
                allocation, and daily changes.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Live Stock Prices</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatic stock price updates so your portfolio value is always
                current.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Secure & Private</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Row-level security ensures your financial data is only visible
                to you.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        <p>Track My Worth &mdash; Track your financial journey</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/delete-account" className="hover:text-foreground transition-colors">
            Delete Account
          </Link>
        </div>
        <a
          href="https://buymeacoffee.com/dalezy"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Heart className="h-4 w-4" />
          Support this project
        </a>
      </footer>
    </div>
  );
}
