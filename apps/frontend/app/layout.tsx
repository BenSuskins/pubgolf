import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Pub Golf",
  description: "Track your Pub Golf scores here",
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
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
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
