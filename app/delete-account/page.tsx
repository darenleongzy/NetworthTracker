import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delete Account or Request Data Deletion",
  description:
    "Instructions for requesting account deletion or personal data deletion from Track My Worth.",
  alternates: {
    canonical: "/delete-account",
  },
};

export default function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Last updated March 26, 2026"
      title="Delete Account or Request Data Deletion"
      summary="You can initiate an account deletion request or a personal data deletion request from this page or from the in-app Settings screen."
    >
      <LegalSection title="How to request deletion">
        <p>
          Email{" "}
          <a
            href={SUPPORT_MAILTO}
            className="text-primary underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          with the subject line <strong>Account Deletion Request</strong> or{" "}
          <strong>Data Deletion Request</strong>.
        </p>
        <p>To help process the request faster, include:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>the email address used for your Track My Worth account;</li>
          <li>
            whether you want the entire account deleted or only specific data
            removed;
          </li>
          <li>
            any extra detail needed to identify the account or data to be
            deleted.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Processing timeline">
        <p>
          Requests are reviewed before processing to help prevent unauthorized
          deletion and protect account security.
        </p>
        <p>
          Once verified, Track My Worth will delete the account or requested
          data within a reasonable timeframe, subject to legal obligations,
          fraud prevention, security needs, and recordkeeping requirements.
        </p>
      </LegalSection>

      <LegalSection title="Information that may be retained">
        <p>
          Certain information may be retained for a limited period if required
          for compliance, dispute resolution, security logs, or enforcement of
          legal rights.
        </p>
      </LegalSection>

      <LegalSection title="Need help">
        <p>
          For deletion, privacy, or account access questions, email{" "}
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
