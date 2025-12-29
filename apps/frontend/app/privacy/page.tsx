import type { Metadata } from "next";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Privacy Policy - Pub Golf",
  description:
    "Privacy policy for Pub Golf. Learn what data we collect, how we use it, and your rights under UK GDPR.",
};

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong>Last Updated:</strong> June 1, 2025
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">What We Collect</h2>
            <p>We collect:</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
              <li>A nickname or name, submitted voluntarily when playing.</li>
              <li>
                Your IP address, which may be logged by our servers for traffic and security
                monitoring.
              </li>
            </ul>
            <p className="text-[var(--color-text-secondary)]">
              We do not collect emails, accounts, or login credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How We Use This Data</h2>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
              <li>To display your submitted name in scorecards and leaderboards.</li>
              <li>To detect and prevent abuse (IP address only).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Cookies</h2>
            <p className="text-[var(--color-text-secondary)]">
              Only essential cookies are used to support gameplay functionality. We do not use
              third-party tracking or analytics cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Data Sharing</h2>
            <p className="text-[var(--color-text-secondary)]">
              We do not sell or share your data with third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your Rights</h2>
            <p className="text-[var(--color-text-secondary)]">Under the UK GDPR, you may request to:</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
              <li>View the information we store (if any)</li>
              <li>Have your submitted name removed</li>
            </ul>
            <p className="text-[var(--color-text-secondary)]">
              Contact us at{' '}
              <a
                href="mailto:development@suskins.co.uk"
                className="text-[var(--color-primary)] hover:underline"
              >
                development@suskins.co.uk
              </a>{' '}
              to make a request.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Changes</h2>
            <p className="text-[var(--color-text-secondary)]">
              We may update this policy. The latest version will always be available on this
              page.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
