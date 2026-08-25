import type { Metadata } from "next";
import { BarChart3, Landmark, ShieldCheck } from "lucide-react";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Singapore Net Worth Tracker for CPF, Cash and Investments",
  description: "Track your net worth in Singapore across CPF, SRS, cash and investments. See your allocation, account history and FIRE progress in one private dashboard.",
  alternates: { canonical: "/singapore-net-worth-tracker" },
};

export default function SingaporeNetWorthTrackerPage() {
  return <SeoLandingPage
    eyebrow="Net worth tracking in Singapore"
    title="Your complete wealth picture, from CPF to investments."
    intro="Bring cash, brokerage holdings, CPF, SRS and other accounts into one private dashboard—then follow how your total net worth changes over time."
    highlights={[
      { icon: Landmark, title: "Accounts that fit Singapore", description: "Keep CPF OA, SA and MA, SRS, cash and investment balances visible in the same financial view." },
      { icon: BarChart3, title: "History, not just a total", description: "Review snapshots, account changes and allocation so you can understand what is moving your net worth." },
      { icon: ShieldCheck, title: "Private by design", description: "Your dashboard is account-protected and your financial records are isolated to your signed-in account." },
    ]}
    sections={[
      { title: "What should your net worth include?", paragraphs: ["Net worth is the value of what you own minus what you owe. For many people in Singapore, that picture includes bank balances, brokerage accounts, CPF savings, SRS investments and property, less mortgages and other liabilities.", "Keeping these balances together makes it easier to spot concentration, review progress and avoid treating each account as an isolated number."] },
      { title: "A practical tracking rhythm", paragraphs: ["You do not need to update every balance daily. A consistent monthly snapshot is often enough to show whether savings, investment performance and debt repayment are moving you in the right direction.", "Track My Worth lets you review account history and allocation without rebuilding the same spreadsheet every month."] },
    ]}
    faqs={[
      { question: "How do I calculate net worth in Singapore?", answer: "Add the current value of your assets—including cash, investments, CPF, SRS and property—then subtract liabilities such as mortgages, education loans and credit balances." },
      { question: "Should CPF be included in net worth?", answer: "Many people include CPF because it is an asset held in their name, while reviewing it separately because withdrawal rules and permitted uses differ from cash." },
      { question: "How often should I update my net worth?", answer: "Monthly or quarterly updates are usually sufficient for long-term planning. Consistency matters more than reacting to daily market movements." },
      { question: "Does Track My Worth connect to my bank?", answer: "Track My Worth is designed around balances and records you add to your account. It does not require you to hand over online-banking credentials." },
    ]}
    relatedLinks={[
      { href: "/cpf-projection-calculator", label: "CPF projection" },
      { href: "/fire-calculator-singapore", label: "Singapore FIRE planning" },
    ]}
  />;
}
