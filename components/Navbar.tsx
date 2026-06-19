"use client";
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["Inicio","inicio"],["Nosotros","nosotros"],["Reflexiones","reflexiones"],["Contacto","contacto"]];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const run = () => setScrolled(scrollY > 20); run(); addEventListener("scroll", run); return () => removeEventListener("scroll", run); }, []);
  return <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
    <Link href="/#inicio" className="brand" aria-label="The Stardust Network, inicio"><span className="brand-mark"><Sparkles size={17}/></span><span>THE STARDUST <b>NETWORK</b></span></Link>
    <nav className="desktop-links" aria-label="Navegación principal">{links.map(([name,id]) => <Link key={id} href={`/#${id}`}>{name}</Link>)}</nav>
    <Link className="nav-cta" href="/#contacto">Únete <span>↗</span></Link>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menú">{open ? <X/> : <Menu/>}</button>
    {open && <nav className="mobile-menu">{links.map(([name,id]) => <Link key={id} onClick={() => setOpen(false)} href={`/#${id}`}>{name}</Link>)}<Link onClick={() => setOpen(false)} href="/#contacto">Únete a la comunidad</Link></nav>}
  </header>;
}
