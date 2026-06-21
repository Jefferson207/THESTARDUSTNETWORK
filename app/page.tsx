import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Compass, Eye, Heart, Orbit, Shield, Sparkles, Star, Users } from "lucide-react";
import constellationsData from "@/data/constellations.json";
import type { Constellation } from "@/lib/types";
import { Stars } from "@/components/Stars";
import { MotionReveal } from "@/components/MotionReveal";
import { ContactForm } from "@/components/ContactForm";
import { getPosts } from "@/lib/posts";

const constellations = constellationsData as Constellation[];
const values = [
  { title: "Amor de decisión", icon: Heart, text: "Elegimos amar de forma consciente, madura y activa, incluso cuando requiere valentía." },
  { title: "Respeto", icon: Shield, text: "Escuchamos, aceptamos las diferencias y cuidamos la dignidad de cada persona." },
  { title: "Solidaridad", icon: Users, text: "Convertimos la empatía en ayuda mutua, servicio y acciones que sostienen." },
  { title: "Fidelidad", icon: Star, text: "Vivimos con coherencia, lealtad y compromiso hacia nuestro propósito compartido." },
  { title: "Libertad", icon: Compass, text: "Cultivamos autonomía, autenticidad y crecimiento interior sin imponer caminos." },
];

export default async function Home() {
  const posts = await getPosts();
  return <main>
    <section id="inicio" className="hero cosmic-hero">
      <Image src="/stardust-constellations.png" fill priority alt="Galaxia violeta atravesada por constelaciones luminosas" sizes="100vw" className="hero-bg" />
      <div className="hero-shade" /><Stars />
      <div className="hero-content">
        <div className="eyebrow"><Sparkles size={13} /> Una red humana de origen cósmico</div>
        <h1>Bienvenido a<br /><em>Stardust</em></h1>
        <div className="hero-copy"><p>A veces, la prisa del mundo nos obliga a mirar el suelo. Olvidamos nuestros orígenes y nuestra esencia.</p><p>Stardust es una red real nacida para recordar que somos polvo de estrellas conscientes. No estamos solos en este universo inmenso. Estamos aquí para construir un refugio donde brille el amor de decisión, el respeto, la solidaridad, la fidelidad y la libertad.</p><p>Levantemos la mirada, caminemos juntos y ayúdanos a entregar esta luz.</p></div>
        <div className="hero-actions"><Link className="button-primary" href="#constelaciones">Explorar constelaciones <ArrowDown size={17} /></Link><Link className="button-ghost join-button" href="#unirme"><span><Users size={14} /></span> Unirme a la comunidad</Link></div>
      </div>
      <a href="#proposito" className="scroll-hint"><span>DESCUBRE</span><ArrowDown size={15} /></a>
    </section>

    <section id="proposito" className="section purpose-section"><div className="section-inner purpose-grid">
      <MotionReveal className="purpose-card"><span className="purpose-number">01</span><div className="purpose-icon"><Orbit /></div><span className="kicker">NUESTRA MISIÓN</span><h2>Recordar para <em>transformar</em></h2><p>Inspirar y conectar a los seres humanos recordando nuestro origen cósmico común, para cultivar un espacio de crecimiento consciente donde la empatía, la escucha sin palabras y el desarrollo personal se transformen en acciones tangibles que mejoren nuestro entorno.</p></MotionReveal>
      <MotionReveal className="purpose-card" delay={0.12}><span className="purpose-number">02</span><div className="purpose-icon"><Eye /></div><span className="kicker">NUESTRA VISIÓN</span><h2>Ser faros de <em>luz libre</em></h2><p>Ser una comunidad global de referencia basada en la evolución del ser, donde cada miembro sea un faro de luz autónomo y libre, capaz de expandir una cultura de paz, entendimiento profundo y bienestar integral en la sociedad.</p></MotionReveal>
    </div></section>

    <section id="valores" className="section values-section"><div className="section-inner">
      <MotionReveal className="section-heading"><div><span className="kicker">LO QUE NOS GUÍA</span><h2>Nuestros valores <em>fundamentales</em></h2></div><p>Cinco luces para orientar cada conversación, vínculo y acción dentro de nuestra red.</p></MotionReveal>
      <div className="values-grid five-values">{values.map(({ title, icon: Icon, text }, index) => <MotionReveal className="value-card glass-card" delay={index * .06} key={title}><span>0{index + 1}</span><Icon /><h3>{title}</h3><p>{text}</p></MotionReveal>)}</div>
    </div></section>

    <section id="constelaciones" className="section constellation-section"><Stars /><div className="section-inner constellation-content">
      <MotionReveal className="section-heading"><div><span className="kicker">NUESTRO UNIVERSO COMPARTIDO</span><h2>Explora las <em>constelaciones</em></h2></div><p>Cada constelación es un espacio vivo para aprender, compartir y transformar intención en comunidad.</p></MotionReveal>
      <div className="constellations-grid">{constellations.map((item, index) => <MotionReveal className={`constellation-card ${index === 0 ? "featured-constellation" : ""}`} delay={(index % 4) * .06} key={item.slug}>
        <div className="constellation-image"><Image src={item.image} fill sizes="(max-width: 800px) 100vw, 50vw" alt={`Imagen cósmica de ${item.title}`} /><div className="constellation-overlay" /></div>
        <div className="constellation-body"><div className="constellation-meta"><span className="constellation-index">CONSTELACIÓN</span><span><BookOpen /> {posts.filter(post => post.constellation === item.slug).length} {posts.filter(post => post.constellation === item.slug).length === 1 ? "ARTÍCULO" : "ARTÍCULOS"}</span></div><h3 id={item.slug}>{item.title}</h3><h4>{item.subtitle}</h4>{item.quote && <blockquote>“{item.quote}”</blockquote>}<p>{item.description}</p><Link href={`/constelaciones/${item.slug}`}>Entrar en esta constelación <ArrowRight size={15} /></Link></div>
      </MotionReveal>)}</div>
    </div></section>

    <section id="unirme" className="section contact"><Stars /><div className="section-inner contact-grid"><MotionReveal><span className="kicker">TU LUZ TAMBIÉN CUENTA</span><h2>Levantemos la mirada.<br /><em>Caminemos juntos.</em></h2><p>Este refugio se construye con personas reales dispuestas a escuchar, crecer y poner sus valores en acción.</p><div className="contact-points"><span><Sparkles /> Ocho espacios para encontrar tu lugar</span><span><Users /> Una comunidad humana y sin juicios</span><span><Heart /> Acciones nacidas del amor consciente</span></div></MotionReveal><MotionReveal><ContactForm /></MotionReveal></div></section>
  </main>;
}
