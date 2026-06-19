import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Heart, Play, Sparkles, Star, Users } from "lucide-react";
import type { Post } from "@/lib/types";
import { getPosts } from "@/lib/posts";
import { Stars } from "@/components/Stars";
import { MotionReveal } from "@/components/MotionReveal";
import { BlogExplorer } from "@/components/BlogExplorer";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";
export default async function Home() { const typedPosts = await getPosts() as Post[]; return <main>
  <section id="inicio" className="hero"><Image src="/stardust-hero.png" fill priority alt="Portal de nebulosa violeta y azul en el espacio" sizes="100vw" className="hero-bg"/><div className="hero-shade"/><Stars/><div className="hero-content"><div className="eyebrow"><Sparkles size={13}/> Una comunidad para crecer juntos</div><h1>Hay un universo<br/>dentro de <em>ti.</em></h1><p>Un espacio para detenernos, conectar con lo esencial y convertirnos, juntos, en mejores personas.</p><div className="hero-actions"><Link className="button-primary" href="#contacto">Únete a la comunidad <ArrowRight size={18}/></Link><Link className="button-ghost" href="#nosotros"><span><Play size={14} fill="currentColor"/></span> Descubre quiénes somos</Link></div><div className="hero-proof"><div className="avatars"><i>A</i><i>M</i><i>L</i><i>+</i></div><span><b>Una comunidad que comienza a brillar</b><small>Tu historia puede ser parte de ella</small></span></div></div><a href="#nosotros" className="scroll-hint"><span>EXPLORA</span><ArrowDown size={15}/></a></section>

  <section id="nosotros" className="section about"><div className="section-inner about-grid"><MotionReveal className="about-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="core"><Sparkles/><span>CRECER<br/>CONECTAR<br/>TRASCENDER</span></div><div className="floating-note note-one"><Heart size={16}/> Humanidad</div><div className="floating-note note-two"><Star size={16}/> Propósito</div></MotionReveal><MotionReveal className="about-copy"><span className="kicker">01 · NUESTRA ESENCIA</span><h2>No buscamos ser perfectos.<br/>Buscamos ser <em>más humanos.</em></h2><p>The Stardust Network nace de una idea sencilla: las mejores transformaciones ocurren cuando dejamos de caminar solos.</p><p>Somos una comunidad nueva para personas que quieren vivir con más conciencia, aprender de otras miradas y crear vínculos que dejen huella.</p><div className="mini-stats"><div><b>01</b><span>Propósito<br/>compartido</span></div><div><b>∞</b><span>Formas<br/>de crecer</span></div><div><b>100%</b><span>Humanidad<br/>real</span></div></div></MotionReveal></div></section>

  <section id="reflexiones" className="section"><div className="section-inner"><MotionReveal className="section-heading"><div><span className="kicker">02 · IDEAS QUE ILUMINAN</span><h2>Reflexiones para <em>tu viaje</em></h2></div><p>Palabras para hacer una pausa, mirar hacia dentro y encontrar nuevas preguntas.</p></MotionReveal><BlogExplorer posts={typedPosts}/></div></section>

  <section id="contacto" className="section contact"><Stars/><div className="section-inner contact-grid"><MotionReveal><span className="kicker">07 · COMIENZA AQUÍ</span><h2>¿Listo para encender<br/><em>tu propia luz?</em></h2><p>No necesitas tener todas las respuestas. Solo la curiosidad de descubrirlas en buena compañía.</p><div className="contact-points"><span><Sparkles/>Acceso anticipado a encuentros</span><span><Users/>Una comunidad cálida y sin juicios</span><span><BookOpen/>Recursos para tu crecimiento</span></div></MotionReveal><MotionReveal><ContactForm/></MotionReveal></div></section>
</main> }
