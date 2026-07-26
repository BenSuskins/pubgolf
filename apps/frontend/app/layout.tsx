import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pubgolf.me"),
  title: {
    default: "Pub Golf — Free Score Tracker for Your Pub Crawl",
    template: "%s | Pub Golf",
  },
  description:
    "Free pub golf score tracker. Host a round, share the game code, and track every sip on a live leaderboard across nine holes. No sign-up, nothing to download.",
  keywords: [
    "pub golf",
    "bar golf",
    "drinking game",
    "pub crawl",
    "bar crawl",
    "pub golf app",
    "pub golf scorecard",
    "pub golf score tracker",
    "pub golf rules",
  ],
  authors: [{ name: "Ben Suskins" }],
  openGraph: {
    title: "Pub Golf — Free Score Tracker for Your Pub Crawl",
    description:
      "Host a round, share the game code, and track every sip on a live leaderboard. 9 Holes. 9 Drinks. 1 Champion.",
    url: "https://pubgolf.me",
    siteName: "Pub Golf",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pub Golf — Free Score Tracker for Your Pub Crawl",
    description:
      "Host a round, share the game code, and track every sip on a live leaderboard. 9 Holes. 9 Drinks. 1 Champion.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pub Golf",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0d1410",
  // iOS Safari zooms the page in whenever a focused field's text is under 16px, which
  // this app's compact inputs (the inline course editor especially) are by design.
  // Capping the scale stops that lurch on focus; pinch-to-zoom is still a user gesture
  // iOS honours, and user-scalable stays on for assistive zoom settings.
  maximumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Pub Golf",
              description:
                "Free pub golf score tracker. Host a round, share the game code, and track every sip on a live leaderboard across nine holes.",
              url: "https://pubgolf.me",
              applicationCategory: "GameApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "GBP",
              },
              author: {
                "@type": "Person",
                name: "Ben Suskins",
              },
            }),
          }}
        />
        <main className="flex-1">{children}</main>
        <footer className="text-center space-y-1 py-4">
          <p className="text-[11px] text-[var(--color-text-faint)] space-x-1">
            <a
              href="https://github.com/BenSuskins/pubgolf/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-secondary)] hover:underline"
            >
              Report an issue
            </a>
            <span>·</span>
            <Link
              href="/terms"
              className="hover:text-[var(--color-text-secondary)] hover:underline"
            >
              Terms & Conditions
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              className="hover:text-[var(--color-text-secondary)] hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
          <p className="text-[10.5px] text-[var(--color-text-faintest)]">
            © 2026 Ben Suskins · Pub Golf
          </p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
