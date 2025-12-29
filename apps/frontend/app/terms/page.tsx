import type { Metadata } from "next";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Terms & Conditions - Pub Golf",
  description:
    "Terms and conditions for using Pub Golf. Read about user submissions, limitations of liability, and governing law.",
};

export default function TermsPage() {
  return (
    <main className="min-h-full p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/"
          className="text-[var(--color-primary)] hover:underline text-sm"
        >
          &larr; Back to Home
        </Link>

        <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold">Terms & Conditions</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong>Last Updated:</strong> June 1, 2025
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Use of the Site</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
              <li>Submit offensive or illegal names</li>
              <li>Attempt to disrupt or abuse the service</li>
            </ul>
            <p className="text-[var(--color-text-secondary)]">
              We reserve the right to remove content or restrict access at our discretion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. User Submissions</h2>
            <p className="text-[var(--color-text-secondary)]">
              You retain ownership of the names you submit. By submitting a name, you grant us
              permission to display it publicly in games and scorecards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. No Accounts or Login</h2>
            <p className="text-[var(--color-text-secondary)]">
              This site does not require or support user accounts. All data is ephemeral and
              public by design.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Monetisation</h2>
            <p className="text-[var(--color-text-secondary)]">
              We may display ads or offer paid features in the future. Your continued use of
              the service implies acceptance of these practices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Limitation of Liability</h2>
            <p className="text-[var(--color-text-secondary)]">
              pubgolf.me is provided &quot;as is&quot;. We are not liable for damages or data loss
              resulting from the use of this site.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Governing Law</h2>
            <p className="text-[var(--color-text-secondary)]">
              These terms are governed by the laws of the United Kingdom.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
