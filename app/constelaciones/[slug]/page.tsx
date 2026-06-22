import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import constellationsData from "@/data/constellations.json";
import type { Constellation } from "@/lib/types";
import { getPosts } from "@/lib/posts";
import { getComments } from "@/lib/comments";
import { Stars } from "@/components/Stars";
import { ArticleImage } from "@/components/ArticleImage";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, rssAlternates, siteConfig } from "@/lib/seo";

const constellations = constellationsData as Constellation[];
export const dynamic = "force-dynamic";
export function generateStaticParams() { return constellations.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = constellations.find(c => c.slug === slug);
  if (!item) return { title: "Constelación no encontrada", robots: { index: false, follow: false } };
  const path = `/constelaciones/${item.slug}`;
  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: path, types: rssAlternates },
    openGraph: { title: item.title, description: item.description, url: path, type: "website", images: [{ url: item.image, alt: `Constelación ${item.title}` }] },
    twitter: { card: "summary_large_image", title: item.title, description: item.description, images: [item.image] },
  };
}

export default async function ConstellationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = constellations.find(c => c.slug === slug);
  if (!item) notFound();
  const [allPosts, comments] = await Promise.all([getPosts(), getComments()]);
  const posts = allPosts.filter(post => post.constellation === slug);
  const path = `/constelaciones/${item.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(path)}#collection`,
      url: absoluteUrl(path),
      name: item.title,
      description: item.description,
      inLanguage: siteConfig.language,
      isPartOf: { "@id": `${siteConfig.url}/#website` },
      mainEntity: { "@type": "ItemList", itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(`/blog/${post.slug}`), name: post.title })) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: item.title, item: absoluteUrl(path) },
      ],
    },
  ];
  return <main className="constellation-page">
    <JsonLd data={structuredData} />
    <section className="constellation-hero"><Image src={item.image} alt={`Constelación ${item.title}`} fill priority className="article-bg" /><div className="article-overlay" /><Stars /><div className="constellation-hero-copy"><Link href="/#constelaciones"><ArrowLeft size={16} /> Volver al mapa</Link><span className="kicker"><Sparkles size={13} /> CONSTELACIÓN</span><h1>{item.title}</h1><h2>{item.subtitle}</h2><blockquote>“{item.quote}”</blockquote><p>{item.description}</p></div></section>
    <section className="section constellation-articles"><div className="section-inner"><div className="section-heading"><div><span className="kicker">CONTENIDO DE ESTA CONSTELACIÓN</span><h2>Artículos <em>recientes</em></h2></div><p>Cada artículo abre un espacio propio para leer, reflexionar y conversar con la comunidad.</p></div>{posts.length ? <div className="posts-grid">{posts.map(post => { const commentCount = comments.filter(comment => comment.postSlug === post.slug).length; return <article className="post-card" key={post.slug}><div className="post-image"><ArticleImage src={post.image} sizes="(max-width: 620px) 100vw, 33vw" alt={`Imagen de ${post.title}`} /><span>{post.category}</span></div><div className="post-body"><div className="post-meta"><small>{post.date}</small><span><MessageCircle size={12} /> {commentCount} {commentCount === 1 ? "comentario" : "comentarios"}</span></div><h3>{post.title}</h3><p>{post.summary}</p><Link href={`/blog/${post.slug}`}>Leer artículo <ArrowRight size={14} /></Link></div></article>; })}</div> : <div className="empty-articles"><Sparkles /><p>Próximamente publicaremos el primer artículo de esta constelación.</p></div>}</div></section>
  </main>;
}
