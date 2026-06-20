"use client";
import Link from "next/link";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import constellations from "@/data/constellations.json";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const run = () => setScrolled(scrollY > 20); run(); addEventListener("scroll", run); return () => removeEventListener("scroll", run); }, []);
  return <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
    <Link href="/#inicio" className="brand" aria-label="The Stardust Network, inicio"><span className="brand-mark"><Sparkles size={17} /></span><span>THE STARDUST <b>NETWORK</b></span></Link>
    <nav className="desktop-links" aria-label="Navegación principal"><Link href="/#proposito">Propósito</Link><Link href="/#valores">Valores</Link><div className="nav-dropdown"><Link href="/#constelaciones">Constelaciones <ChevronDown size={13} /></Link><div className="dropdown-panel">{constellations.map((item, index) => <Link key={item.slug} href={`/#${item.slug}`}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</Link>)}</div></div></nav>
    <Link className="nav-cta" href="/#unirme">Unirme <span>↗</span></Link>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menú">{open ? <X /> : <Menu />}</button>
    {open && <nav className="mobile-menu"><small>CONSTELACIONES</small>{constellations.map((item, index) => <Link key={item.slug} onClick={() => setOpen(false)} href={`/#${item.slug}`}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</Link>)}<Link onClick={() => setOpen(false)} href="/#unirme">Unirme a la comunidad</Link></nav>}
  </header>;
}
