import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getConstellations } from "@/lib/constellations";
import { rssAlternates, siteConfig } from "@/lib/seo";
import "./globals.css";
import "./comments.css";
import "./stars-motion.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
export const dynamic = "force-dynamic";
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050817", colorScheme: "dark" };
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Comunidad y crecimiento personal",
  keywords: ["crecimiento consciente", "comunidad", "desarrollo personal", "empatía", "solidaridad", "libertad", "origen cósmico"],
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" },
  alternates: { types: rssAlternates },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: siteConfig.locale,
    images: [{ url: siteConfig.socialImage, width: 1774, height: 887, alt: "The Stardust Network, una comunidad de crecimiento consciente" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.socialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const constellations = await getConstellations();
  return <html lang="es" className={`${manrope.variable} ${space.variable}`}><body><Navbar constellations={constellations} />{children}<Footer constellations={constellations} /></body></html>;
}
