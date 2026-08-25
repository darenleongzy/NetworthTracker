import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function LegalPage({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Image src="/track-my-worth-mark.svg" alt="" width={24} height={24} priority />
            <span>Track My Worth</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/privacy">
              <Button variant="ghost" size="sm">
                Privacy
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" size="sm">
                Terms
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-14">
        <article className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {summary}
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-7 text-foreground sm:text-base">
            {children}
          </div>
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
