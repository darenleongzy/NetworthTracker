import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Highlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Section = {
  title: string;
  paragraphs: string[];
};

type FAQ = {
  question: string;
  answer: string;
};

type RelatedLink = {
  href: string;
  label: string;
};

export function SeoLandingPage({
  eyebrow,
  title,
  intro,
  highlights,
  sections,
  faqs,
  relatedLinks,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  highlights: Highlight[];
  sections: Section[];
  faqs: FAQ[];
  relatedLinks: RelatedLink[];
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="border-b border-white/10 bg-[#0b1528] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/track-my-worth-mark.svg" alt="" width={26} height={26} priority />
            Track My Worth
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/features" className="hidden rounded-md px-3 py-2 text-slate-200 hover:bg-white/10 sm:block">
              Features
            </Link>
            <Link href="/signup" className="rounded-md bg-teal-300 px-4 py-2 font-medium text-slate-950 hover:bg-teal-200">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0b1528] px-5 py-20 text-white sm:px-6 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,212,191,0.18),transparent_32rem),radial-gradient(circle_at_15%_80%,rgba(59,130,246,0.13),transparent_28rem)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.045em] sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{intro}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-md bg-teal-300 px-6 text-sm font-semibold text-slate-950 hover:bg-teal-200">
              Start tracking your worth
            </Link>
            <Link href="/features" className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 px-6 text-sm font-medium hover:bg-white/10">
              Explore all features
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 md:grid-cols-3 md:py-24">
        {highlights.map(({ icon: Icon, title: itemTitle, description }) => (
          <article key={itemTitle} className="border-t border-border pt-6">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold">{itemTitle}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="border-y bg-muted/35 px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-4xl space-y-14">
          {sections.map((section) => (
            <article key={section.title} className="grid gap-4 md:grid-cols-[0.8fr_1.4fr] md:gap-12">
              <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
              <div className="space-y-4 leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Common questions</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">What to know before you begin</h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold marker:hidden">
                {faq.question}
              </summary>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t bg-[#0b1528] px-5 py-16 text-white sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Keep planning</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight">Build a clearer view of your financial future.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 hover:border-teal-300 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
