import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import constellationsData from "@/data/constellations.json";
import commentsData from "@/data/comments.json";
import type { Comment, Constellation } from "@/lib/types";
import { getPosts } from "@/lib/posts";
import { Stars } from "@/components/Stars";

const constellations = constellationsData as Constellation[];
const comments = commentsData as Comment[];
export const dynamic = "force-dynamic";
export function generateStaticParams() { return constellations.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = constellations.find(c => c.slug === slug); return { title: item?.title, description: item?.description }; }

export default async function ConstellationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = constellations.find(c => c.slug === slug);
  if (!item) notFound();
  const posts = (await getPosts()).filter(post => post.constellation === slug);
  const relatedComments = comments.filter(comment => posts.some(post => post.slug === comment.postSlug));
  return <main className="constellation-page">
    <section className="constellation-hero"><Image src={item.image} alt={`Constelación ${item.title}`} fill priority className="article-bg" /><div className="article-overlay" /><Stars /><div className="constellation-hero-copy"><Link href="/#constelaciones"><ArrowLeft size={16} /> Volver al mapa</Link><span className="kicker"><Sparkles size={13} /> CONSTELACIÓN</span><h1>{item.title}</h1><h2>{item.subtitle}</h2><blockquote>“{item.quote}”</blockquote><p>{item.description}</p></div></section>
    <section className="section"><div className="section-inner"><div className="section-heading"><div><span className="kicker">VOCES DE ESTA CONSTELACIÓN</span><h2>Publicaciones <em>relacionadas</em></h2></div></div><div className="posts-grid">{posts.map(post => <article className="post-card" key={post.slug}><div className="post-image"><Image src={post.image} fill alt="" /><span>{post.category}</span></div><div className="post-body"><small>{post.date}</small><h3>{post.title}</h3><p>{post.summary}</p><Link href={`/blog/${post.slug}`}>Leer publicación <ArrowRight size={14} /></Link></div></article>)}</div>{relatedComments.length > 0 && <div className="community-echoes"><span className="kicker"><MessageCircle size={13} /> ECOS DE LA COMUNIDAD</span>{relatedComments.map(comment => <blockquote key={`${comment.postSlug}-${comment.name}`}><p>“{comment.message}”</p><footer>{comment.name} · {comment.date}</footer></blockquote>)}</div>}</div></section>
  </main>;
}
