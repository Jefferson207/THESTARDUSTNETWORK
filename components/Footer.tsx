import Link from "next/link";
import { Music2, Sparkles } from "lucide-react";
import type { Constellation } from "@/lib/types";
import { VisitCounter } from "@/components/VisitCounter";

export function Footer({ constellations }: { constellations: Constellation[] }) {
  return <footer><div className="footer-main"><div><Link href="/#inicio" className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>THE STARDUST <b>NETWORK</b></span></Link><p>Polvo de estrellas consciente.<br />Una red para caminar juntos.</p><VisitCounter /></div><div className="footer-links constellation-links"><h4>Constelaciones</h4>{constellations.slice(0, 4).map(item => <Link key={item.slug} href={`/#${item.slug}`}>{item.title}</Link>)}</div><div className="footer-links constellation-links"><h4>Mas luz</h4>{constellations.slice(4).map(item => <Link key={item.slug} href={`/#${item.slug}`}>{item.title}</Link>)}</div><div><h4>Sigue la senal</h4><div className="socials"><a href="https://www.tiktok.com/@azby505" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><Music2 /></a></div></div></div><div className="footer-bottom"><span>&copy; 2026 The Stardust Network</span><span className="creator-credit">Creado por <b>azby505</b> &middot; Diseno y desarrollo para conectar comunidad e ideas.</span><span>Levantemos la mirada. Esta es nuestra casa.</span></div></footer>;
}
