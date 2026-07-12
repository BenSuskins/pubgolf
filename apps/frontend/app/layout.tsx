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
  themeColor: "#0d1410",
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
