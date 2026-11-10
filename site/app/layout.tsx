import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlowMyna } from "@/components/FlowMyna";
import Script from "next/script";
import { PLAUSIBLE_DOMAIN, SHARE_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "OnKey is a free, open-source singing trainer for the Mac. It listens to the music playing on your Mac, learns the singer's melody, and shows you a pitch guide as you sing, so you can see where you're sharp or flat. It never saves the music.";

export const metadata: Metadata = {
  title: { default: "OnKey: learn to sing the songs you love", template: "%s · OnKey" },
  description: DESCRIPTION,
  // Link previews need the site's own address (LAUNCH.siteUrl in lib/site.ts).
  ...(SITE_URL && {
    metadataBase: new URL(SITE_URL),
    openGraph: { title: "OnKey", description: DESCRIPTION, url: "/", siteName: "OnKey", type: "website", images: [{ url: SHARE_IMAGE, width: 1280, height: 640, alt: "OnKey: learn to sing the songs you love" }] },
    twitter: { card: "summary_large_image", title: "OnKey", description: DESCRIPTION, images: [SHARE_IMAGE] },
  }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080c" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        {/* visit counts without cookies or personal data (Plausible); outbound links (download, GitHub, Discord)
            are counted as they're followed. Plausible ignores localhost. */}
        <FlowMyna />
        {PLAUSIBLE_DOMAIN && (
          <Script defer data-domain={PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.outbound-links.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
