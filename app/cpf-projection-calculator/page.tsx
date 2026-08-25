import type { Metadata } from "next";
import { Calculator, Home, Landmark } from "lucide-react";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "CPF Projection Calculator for OA, SA and MA",
  description: "Project CPF OA, SA and MA balances using your age, salary, contribution allocations, interest assumptions and CPF housing deductions.",
  alternates: { canonical: "/cpf-projection-calculator" },
};

export default function CpfProjectionCalculatorPage() {
  return <SeoLandingPage
    eyebrow="CPF projection calculator"
    title="See how your CPF balances could grow over time."
    intro="Model your OA, SA and MA together using salary-based contributions, adjustable interest assumptions, mortgage deductions and your chosen planning horizon."
    highlights={[
      { icon: Landmark, title: "OA, SA and MA together", description: "Start with your current account balances and keep each CPF component visible throughout the projection." },
      { icon: Calculator, title: "Adjustable assumptions", description: "Explore how salary, contribution allocation, interest and time change the estimated result." },
      { icon: Home, title: "Account for housing", description: "Include recurring CPF-funded mortgage deductions to avoid overstating the future value of your OA." },
    ]}
    sections={[
      { title: "How the CPF projection works", paragraphs: ["A projection begins with your current OA, SA and MA balances. Estimated contributions are then allocated based on the age and salary inputs you provide, while interest assumptions compound the balances through the selected horizon.", "Because CPF rules, ceilings and allocations can change, projections are planning estimates rather than a statement of future benefits."] },
      { title: "Model the assumptions that matter", paragraphs: ["A useful estimate should reflect more than headline interest rates. Salary changes, contribution ceilings, age-based allocations and CPF-funded housing payments can materially affect the path of each account.", "Try more than one scenario and compare a conservative case with your expected case before using the result in a broader retirement plan."] },
    ]}
    faqs={[
      { question: "Is this an official CPF Board calculator?", answer: "No. Track My Worth is an independent planning tool and is not affiliated with or endorsed by CPF Board. Confirm current rules and account information with official CPF sources." },
      { question: "Which CPF accounts can I project?", answer: "The planner is designed to show Ordinary Account, Special Account and MediSave Account balances separately while combining them with your wider financial view." },
      { question: "Can I include CPF mortgage deductions?", answer: "Yes. You can include CPF-funded mortgage deductions in the assumptions so the OA projection better reflects planned housing use." },
      { question: "Are CPF projections guaranteed?", answer: "No. Results depend on the information and assumptions entered, while future income, policies, ceilings, allocation rates and interest rates may differ." },
    ]}
    relatedLinks={[
      { href: "/singapore-net-worth-tracker", label: "Net worth tracking" },
      { href: "/fire-calculator-singapore", label: "Singapore FIRE planning" },
    ]}
  />;
}
