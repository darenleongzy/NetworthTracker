import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3, Sparkles, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <span className="text-xl font-bold">NetWorth Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button>Request Access</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          {/* Early Access Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Early Access &mdash; Limited Spots Available</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track Your <span className="text-primary">Net Worth</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Monitor your savings, investments, and overall financial health in
            one simple dashboard. See how your wealth grows over time.
          </p>

          {/* Invite-Only Notice */}
          <p className="mt-4 text-sm text-muted-foreground">
            We&apos;re currently invite-only to ensure the best experience.
            <br />
            Join the waitlist to get early access.
          </p>

          <div className="mt-8 flex gap-4">
            <Link href="/signup">
              <Button size="lg">Request Access</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="px-6 py-16">
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
                  alt="NetWorth Tracker Dashboard Preview"
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

        <section className="border-t px-6 py-16">
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
        <p>Net Worth Tracker &mdash; Track your financial journey</p>
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
