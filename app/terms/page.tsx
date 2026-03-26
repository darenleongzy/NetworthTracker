import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { SITE_URL, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Track My Worth, including acceptable use, account responsibilities, and legal terms for the web and mobile apps.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Last updated March 25, 2026"
      title="Terms of Service"
      summary="These Terms of Service govern your use of Track My Worth on the web and mobile app. By using the service, you agree to these terms."
    >
      <LegalSection title="Use of the service">
        <p>
          Track My Worth provides tools for personal wealth tracking, portfolio
          monitoring, expense tracking, CPF and SRS planning, and FIRE
          projections. The service is offered for personal informational use.
        </p>
        <p>
          These terms apply to the website, web app, and mobile app available
          through{" "}
          <Link href={SITE_URL} className="text-primary underline underline-offset-4">
            {SITE_URL}
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Eligibility and accounts">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for activity that occurs through your account.
        </p>
        <p>
          You agree to provide accurate information when creating an account and
          when entering financial, planning, or preference data into the app.
        </p>
      </LegalSection>

      <LegalSection title="No financial, tax, or legal advice">
        <p>
          Track My Worth is a software tool and does not provide financial,
          investment, tax, legal, accounting, or retirement advice. Projections,
          CPF scenarios, FIRE calculations, and portfolio summaries are
          informational estimates only and may not reflect real-world outcomes.
        </p>
        <p>
          You are responsible for reviewing your own circumstances and, where
          appropriate, consulting qualified professionals before making
          financial or retirement decisions.
        </p>
      </LegalSection>

      <LegalSection title="Your content and responsibilities">
        <p>
          You retain responsibility for the data you enter into the service,
          including balances, holdings, expenses, symbols, rates, and planning
          assumptions.
        </p>
        <p>You agree not to use the service to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>break the law or violate the rights of others;</li>
          <li>attempt unauthorized access to accounts, systems, or data;</li>
          <li>
            interfere with the operation, security, or integrity of the
            service;
          </li>
          <li>
            upload malicious code, misuse automation, or reverse engineer the
            service except where applicable law permits it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          Features may change over time, including dashboards, planning tools,
          pricing, waitlist access, or mobile functionality. The service may be
          modified, suspended, or discontinued at any time.
        </p>
        <p>
          Reasonable efforts may be made to maintain availability, but Track My
          Worth does not guarantee uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Track My Worth may rely on third-party infrastructure, authentication,
          hosting, email, and market-data related services. Those services may
          be subject to their own terms and privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          Access to the service may be suspended or terminated if these terms
          are violated, if the service is misused, or if needed to protect the
          app, users, or platform security.
        </p>
        <p>
          You may stop using the service at any time. For account deletion
          requests, contact{" "}
          <a
            href={SUPPORT_MAILTO}
            className="text-primary underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers and limitation of liability">
        <p>
          The service is provided on an “as is” and “as available” basis to the
          fullest extent permitted by law. Track My Worth disclaims implied
          warranties, including merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
        <p>
          To the fullest extent permitted by law, Track My Worth will not be
          liable for indirect, incidental, special, consequential, exemplary, or
          punitive damages, or for loss of profits, data, goodwill, or business
          opportunities arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection title="Governing terms">
        <p>
          These terms are intended to be interpreted under applicable law. If
          any provision is found unenforceable, the remaining provisions will
          continue in effect to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms of Service can be sent to{" "}
          <a
            href={SUPPORT_MAILTO}
            className="text-primary underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
