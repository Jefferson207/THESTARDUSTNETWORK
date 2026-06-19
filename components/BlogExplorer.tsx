"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { MotionReveal } from "./MotionReveal";

export function BlogExplorer({ posts }: { posts: Post[] }) {
  const categories = ["Todos", ...Array.from(new Set(posts.map(p => p.category)))];
  const [category, setCategory] = useState("Todos"); const [query, setQuery] = useState("");
  const filtered = useMemo(() => posts.filter(p => (category === "Todos" || p.category === category) && `${p.title} ${p.summary}`.toLowerCase().includes(query.toLowerCase())), [posts, category, query]);
  return <>
    <div className="blog-tools"><div className="filter-row">{categories.map(item => <button className={item === category ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar una idea..." aria-label="Buscar reflexiones" /></label></div>
    <div className="posts-grid">{filtered.map((post, i) => <MotionReveal key={post.slug} delay={i * .08}><article className="post-card">
      <div className="post-image"><Image src={post.image} alt="Nebulosa violeta" fill sizes="(max-width: 768px) 100vw, 33vw" style={{objectFit:"cover"}}/><span>{post.category}</span></div>
      <div className="post-body"><small>{post.date} <i/> {post.readTime} de lectura</small><h3>{post.title}</h3><p>{post.summary}</p><Link href={`/blog/${post.slug}`}>Leer reflexión <ArrowUpRight size={17}/></Link></div>
    </article></MotionReveal>)}</div>
    {!filtered.length && <p className="empty">No encontramos reflexiones con esos criterios.</p>}
  </>;
}
