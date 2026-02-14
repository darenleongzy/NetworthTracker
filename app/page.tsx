import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3 } from "lucide-react";

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
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track Your <span className="text-primary">Net Worth</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Monitor your savings, investments, and overall financial health in
            one simple dashboard. See how your wealth grows over time.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/signup">
              <Button size="lg">Start Tracking Free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
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
        Net Worth Tracker &mdash; Track your financial journey
      </footer>
    </div>
  );
}
