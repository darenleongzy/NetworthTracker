import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { SITE_URL, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Track My Worth, covering how account, financial, and app data is collected, used, and protected.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Last updated March 25, 2026"
      title="Privacy Policy"
      summary="This Privacy Policy explains what information Track My Worth collects, how it is used, and the choices available to you when you use the web app or mobile app."
    >
      <LegalSection title="Overview">
        <p>
          Track My Worth is a personal finance and net worth tracking app. You
          can use it to store account balances, holdings, CPF and SRS details,
          expenses, FIRE planning assumptions, and related preferences.
        </p>
        <p>
          This Privacy Policy applies to the Track My Worth website, web app,
          and mobile app available from{" "}
          <Link href={SITE_URL} className="text-primary underline underline-offset-4">
            {SITE_URL}
          </Link>
          .
        </p>
        <p>
          Track My Worth is a software tool only. It does not provide
          financial, investment, tax, retirement, accounting, or legal advice,
          and nothing in the app should be treated as a recommendation or
          personalized advice.
        </p>
      </LegalSection>

      <LegalSection title="Information collected">
        <p>Depending on how you use the service, Track My Worth may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            account information, such as your email address and authentication
            details handled through the sign-in system;
          </li>
          <li>
            financial information you enter, including account names, balances,
            cash holdings, stock holdings, CPF balances, CPF planning settings,
            SRS balances, expenses, and FIRE assumptions;
          </li>
          <li>
            preference information, such as your base currency and display
            choices;
          </li>
          <li>
            waitlist and support information if you join the waitlist, contact
            support, or reply to service emails;
          </li>
          <li>
            basic technical information required to operate the app, such as
            session state, device or browser details, and app usage data needed
            to keep you signed in and deliver the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>Information is used to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>create and maintain your account;</li>
          <li>display your financial dashboard, reports, and projections;</li>
          <li>
            save your preferences, CPF settings, expenses, and FIRE planning
            inputs;
          </li>
          <li>support app functionality across web and mobile devices;</li>
          <li>respond to support requests and account-related questions;</li>
          <li>
            send service communications, such as waitlist updates or access
            emails when applicable;
          </li>
          <li>protect the service, users, and platform integrity.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How information is shared">
        <p>
          Track My Worth does not sell your personal information. Information
          may be shared only in these limited cases:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            with infrastructure and service providers that help operate the app,
            such as hosting, authentication, database, and email delivery
            providers;
          </li>
          <li>
            with data providers or backend services that support market data,
            exchange-rate information, or similar app functionality;
          </li>
          <li>
            if required to comply with law, regulation, legal process, or a
            valid governmental request;
          </li>
          <li>
            if necessary to protect the rights, safety, or security of users,
            the service, or the public.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Data storage and security">
        <p>
          Track My Worth uses commercially reasonable administrative, technical,
          and organizational safeguards to protect information stored in the
          service. This includes access controls intended to limit account data
          to the authenticated account owner.
        </p>
        <p>
          No method of transmission or storage is completely secure, so absolute
          security cannot be guaranteed.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          Account and financial data are retained for as long as needed to
          provide the service, maintain legitimate business records, resolve
          disputes, enforce agreements, and meet legal obligations.
        </p>
        <p>
          If you want your account or data deleted, contact{" "}
          <a
            href={SUPPORT_MAILTO}
            className="text-primary underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>
          {" "}or follow the instructions at{" "}
          <Link href="/delete-account" className="text-primary underline underline-offset-4">
            /delete-account
          </Link>
          . Requests will be reviewed and processed subject to applicable law,
          fraud prevention, security needs, and recordkeeping obligations.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You can update many data fields directly inside the app, including
            accounts, expenses, CPF settings, and FIRE preferences.
          </li>
          <li>You can sign out from the web app or mobile app at any time.</li>
          <li>
            You can request access, correction, or deletion by emailing{" "}
            <a
              href={SUPPORT_MAILTO}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            {" "}or by using the deletion request path at{" "}
            <Link href="/delete-account" className="text-primary underline underline-offset-4">
              /delete-account
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Track My Worth is not directed to children under 13, and the service
          is not intended for users who are not legally able to manage their
          own accounts under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          This Privacy Policy may be updated from time to time. If material
          changes are made, the updated version will be posted at this page with
          a revised effective date.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy questions, support requests, or account deletion
          inquiries, email{" "}
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
