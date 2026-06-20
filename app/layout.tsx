import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";
import "./comments.css";
import "./stars-motion.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
export const metadata: Metadata = { title: { default: "The Stardust Network", template: "%s · The Stardust Network" }, description: "Una red humana y cósmica para crecer con conciencia, comunidad y propósito.", metadataBase: new URL("https://thestardustnetwork.org"), icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" }, openGraph: { title: "The Stardust Network", description: "Somos polvo de estrellas conscientes. Caminemos juntos.", type: "website", locale: "es_PE" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es" className={`${manrope.variable} ${space.variable}`}><body><Navbar />{children}<Footer /></body></html>; }
