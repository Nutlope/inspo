import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import ReactDOM from "react-dom";
import { Masthead } from "@/components/masthead";
import { Colophon } from "@/components/colophon";
import { CommandPalette } from "@/components/command-palette";
import { CompareDock } from "@/components/compare-dock";
import { site } from "@/lib/site";
import { BASE_URL } from "@/lib/base-url";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const BASE = BASE_URL;

// The host that serves every captured screenshot. Hard-coded because
// the build environment may not have INSPO_BLOB_BASE_URL set, and we
// want the preconnect hint emitted regardless. If you migrate to a
// different blob bucket, update this and `build-static-seed.ts` in
// lockstep.
const BLOB_ORIGIN = "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: `${site.name} - ${site.tagline}`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preconnect to the blob origin so the TLS handshake overlaps with
  // HTML parsing - saves ~80-200 ms on first image on cold page loads,
  // where every gallery tile pulls from this host. Next 16's preferred
  // API is ReactDOM.preconnect/prefetchDNS rather than raw <link> tags.
  ReactDOM.preconnect(BLOB_ORIGIN, { crossOrigin: "anonymous" });
  ReactDOM.prefetchDNS(BLOB_ORIGIN);

  return (
    <html
      lang="en"
      // Next 16 asks for this hint when CSS sets scroll-behavior:
      // smooth - it lets the router disable smooth scrolling during
      // route transitions instead of animating scroll restoration.
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${interTight.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Masthead />
        <main className="flex-1">{children}</main>
        <Colophon />
        <CommandPalette />
        <CompareDock />
      </body>
    </html>
  );
}
