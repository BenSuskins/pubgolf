import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pubgolf.me"),
  title: "Pub Golf",
  description: "9 Holes. 9 Drinks. 1 Champion.",
  keywords: [
    "pub golf",
    "bar golf",
    "drinking game",
    "pub crawl",
    "bar crawl",
    "pub golf app",
    "pub golf scorecard",
  ],
  authors: [{ name: "Ben Suskins" }],
  openGraph: {
    title: "Pub Golf",
    description: "9 Holes. 9 Drinks. 1 Champion.",
    url: "https://pubgolf.me",
    siteName: "Pub Golf",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pub Golf - 9 Holes. 9 Drinks. 1 Champion.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pub Golf",
    description: "9 Holes. 9 Drinks. 1 Champion.",
    images: ["/og-image.png"],
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
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col bg-ambient`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Pub Golf",
              description: "9 Holes. 9 Drinks. 1 Champion.",
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
        <footer className="text-center text-sm text-[var(--color-text-secondary)] space-y-2 py-4">
          <p>© 2025 Ben Suskins | Pub Golf</p>
          <p className="space-x-2">
            <Link
              href="/terms"
              className="text-[var(--color-primary)] hover:underline"
            >
              Terms & Conditions
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              className="text-[var(--color-primary)] hover:underline"
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <a
              href="https://github.com/BenSuskins/pubgolf/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              Report an issue
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
