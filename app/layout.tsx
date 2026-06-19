import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";
import "./comments.css";
import "./stars-motion.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
export const metadata: Metadata = { title: { default: "The Stardust Network", template: "%s · The Stardust Network" }, description: "Una comunidad para crecer con intención, conectar con otros y convertirnos en mejores personas.", metadataBase: new URL("https://thestardustnetwork.org"), openGraph: { title: "The Stardust Network", description: "Crecer también es un viaje compartido.", type: "website", locale: "es_PE" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es" className={`${manrope.variable} ${space.variable}`}><body><Navbar/>{children}<Footer/></body></html> }
