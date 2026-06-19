import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import comments from "@/data/comments.json";
import type { Comment, Post } from "@/lib/types";
import { CommentSection } from "@/components/CommentSection";
import { getPosts } from "@/lib/posts";

const typedComments = comments as Comment[];
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) { const { slug } = await params; const posts = await getPosts(); const post=posts.find(p=>p.slug===slug); return {title:post?.title, description:post?.summary}; }
export default async function PostPage({ params }: { params: Promise<{slug:string}> }) { const { slug } = await params; const posts = await getPosts() as Post[]; const post=posts.find(p=>p.slug===slug); if(!post) notFound(); const postComments=typedComments.filter(c=>c.postSlug===post.slug); return <main className="article-page"><div className="article-hero"><Image src={post.image} alt="Nebulosa cósmica" fill priority className="article-bg"/><div className="article-overlay"/><div className="article-heading"><Link href="/#reflexiones"><ArrowLeft size={17}/> Volver a reflexiones</Link><span className="kicker">{post.category}</span><h1>{post.title}</h1><p>{post.summary}</p><small>{post.date} · <Clock size={14}/> {post.readTime} de lectura</small></div></div><article className="article-content"><div className="article-icon"><Sparkles/></div>{post.content.map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article><CommentSection postSlug={post.slug} initialComments={postComments}/></main> }
