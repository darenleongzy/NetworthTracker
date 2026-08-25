import type { Metadata } from "next";
import { Calculator, PiggyBank, TrendingUp } from "lucide-react";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "FIRE Calculator Singapore — Plan Financial Independence",
  description: "Estimate your FIRE number and financial independence timeline in Singapore using expenses, savings, investment returns and withdrawal-rate assumptions.",
  alternates: { canonical: "/fire-calculator-singapore" },
};

export default function FireCalculatorSingaporePage() {
  return <SeoLandingPage
    eyebrow="FIRE calculator for Singapore"
    title="Turn today’s savings into a clearer path to financial independence."
    intro="Estimate your FIRE target and timeline using your spending, current investments, ongoing savings and return assumptions—alongside the rest of your net worth."
    highlights={[
      { icon: Calculator, title: "Estimate your FIRE number", description: "Translate annual spending and a chosen withdrawal-rate assumption into a practical target to review." },
      { icon: PiggyBank, title: "Connect savings to the goal", description: "See how current invested assets and regular contributions may change the time required to reach your target." },
      { icon: TrendingUp, title: "Test different scenarios", description: "Compare return, inflation and savings assumptions instead of relying on one optimistic forecast." },
    ]}
    sections={[
      { title: "What is a FIRE number?", paragraphs: ["A FIRE number is an estimate of the invested assets needed to support annual spending without relying on employment income. A common starting point divides annual expenses by an assumed withdrawal rate, but the right margin depends on your circumstances.", "In Singapore, CPF payouts, housing costs, healthcare, taxes and the timing of access to different accounts can all affect how you interpret that target."] },
      { title: "Plan with ranges, not promises", paragraphs: ["Market returns do not arrive smoothly, and expenses rarely remain fixed for decades. Compare conservative, expected and optimistic assumptions to understand how sensitive your timeline is.", "Track My Worth is a planning tool, not financial advice. Use the projection as a way to organize questions and review trade-offs, not as a guarantee of retirement readiness."] },
    ]}
    faqs={[
      { question: "How is a FIRE number calculated?", answer: "A common estimate divides expected annual spending by a chosen withdrawal rate. For example, a lower assumed withdrawal rate produces a higher target and a larger planning margin." },
      { question: "Should CPF be included in a FIRE calculation?", answer: "CPF can form part of a retirement plan, but access timing and permitted uses differ from a liquid investment portfolio. It is often useful to model CPF separately, then consider how it supports later retirement years." },
      { question: "What expenses should I include?", answer: "Include recurring living costs, housing, insurance, healthcare, taxes, dependants, travel and irregular replacements. Use annual spending that reflects the life you actually intend to fund." },
      { question: "Does the calculator provide financial advice?", answer: "No. It provides estimates based on your inputs and assumptions. Consider professional advice for decisions involving investments, tax, insurance or retirement income." },
    ]}
    relatedLinks={[
      { href: "/singapore-net-worth-tracker", label: "Net worth tracking" },
      { href: "/cpf-projection-calculator", label: "CPF projection" },
    ]}
  />;
}
