import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import comments from "@/data/comments.json";
import type { Comment, Post } from "@/lib/types";
import { CommentSection } from "@/components/CommentSection";
import { Stars } from "@/components/Stars";
import { ArticleImage } from "@/components/ArticleImage";
import { getPosts } from "@/lib/posts";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, postPublishedDate, rssAlternates, siteConfig } from "@/lib/seo";

const typedComments = comments as Comment[];
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getPosts();
  const post = posts.find(p => p.slug === slug);
  if (!post) return { title: "Artículo no encontrado", robots: { index: false, follow: false } };
  const path = `/blog/${post.slug}`;
  const publishedTime = postPublishedDate(post);
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: path, types: rssAlternates },
    openGraph: { title: post.title, description: post.summary, url: path, type: "article", publishedTime, section: post.category, images: [{ url: post.image, alt: `Imagen de ${post.title}` }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary, images: [post.image] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await getPosts() as Post[];
  const post = posts.find(p => p.slug === slug);
  if (!post) notFound();
  const postComments = typedComments.filter(c => c.postSlug === post.slug);
  const path = `/blog/${post.slug}`;
  const publishedDate = postPublishedDate(post);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${absoluteUrl(path)}#article`,
      mainEntityOfPage: absoluteUrl(path),
      headline: post.title,
      description: post.summary,
      image: [absoluteUrl(post.image)],
      datePublished: publishedDate,
      dateModified: publishedDate,
      articleSection: post.category,
      inLanguage: siteConfig.language,
      wordCount: post.content.join(" ").trim().split(/\s+/).length,
      author: { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: siteConfig.name },
      publisher: { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: siteConfig.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: post.category, item: absoluteUrl(`/constelaciones/${post.constellation}`) },
        { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(path) },
      ],
    },
  ];
  return <main className="article-page"><JsonLd data={structuredData} /><div className="article-hero"><ArticleImage src={post.image} alt={`Imagen de ${post.title}`} priority className="article-bg" /><div className="article-overlay" /><Stars /><div className="article-heading"><Link href={`/constelaciones/${post.constellation}`}><ArrowLeft size={17} /> Volver a la constelación</Link><span className="kicker">{post.category}</span><h1>{post.title}</h1><p>{post.summary}</p><small>{post.date} · <Clock size={14} /> {post.readTime} de lectura</small></div></div><article className="article-content"><div className="article-icon"><Sparkles /></div>{post.content.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</article><CommentSection postSlug={post.slug} initialComments={postComments} /></main>;
}
