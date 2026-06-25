"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, Check, Eye, LockKeyhole, LogIn, LogOut, RefreshCw, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import constellations from "@/data/constellations.json";
import type { Post } from "@/lib/types";

type PostsResponse = { posts?: Post[]; error?: string };

export function AdminPostForm() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState("");
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function adminHeaders() {
    return { "x-admin-username": username, "x-admin-password": password };
  }

  function editorContentBlocks() {
    const editor = editorRef.current;
    if (!editor) return [];
    const container = document.createElement("div");
    container.innerHTML = editor.innerHTML;
    const blocks = Array.from(container.children).map(child => child.outerHTML.trim()).filter(Boolean);
    if (blocks.length) return blocks.slice(0, 30);
    return editor.innerText.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean).slice(0, 30);
  }

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const response = await fetch("/api/admin/posts", { headers: adminHeaders(), cache: "no-store" });
      const result = await response.json() as PostsResponse;
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los articulos.");
      setPosts(result.posts || []);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudieron cargar los articulos.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const result = await response.json() as { authenticated?: boolean; error?: string };
      if (!response.ok || !result.authenticated) throw new Error(result.error || "No se pudo iniciar sesion.");
      setAuthenticated(true);
      setCreatedSlug("");
      setTimeout(loadPosts, 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesion.");
    } finally {
      setSending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = editorContentBlocks();
    const rawDate = String(form.get("date") || "");
    const date = rawDate ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rawDate}T00:00:00Z`)) : "";
    const body = Object.fromEntries(form.entries());
    body.date = date;
    body.publishedAt = rawDate;
    setSending(true);
    setError("");
    setCreatedSlug("");
    try {
      if (!content.length) throw new Error("Escribe el contenido del articulo.");
      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.set("file", imageFile);
        const uploadResponse = await fetch("/api/admin/upload", { method: "POST", headers: adminHeaders(), body: uploadForm });
        const uploadResult = await uploadResponse.json() as { url?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.url) throw new Error(uploadResult.error || "No se pudo subir la imagen.");
        body.image = uploadResult.url;
      }
      const response = await fetch("/api/admin/posts", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ ...body, content }) });
      const result = await response.json() as { slug?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo publicar el articulo.");
      setCreatedSlug(result.slug || "");
      formElement.reset();
      if (editorRef.current) editorRef.current.innerHTML = "";
      setImageFile(null);
      await loadPosts();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo crear el articulo.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setSending(false);
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`Eliminar "${post.title}"? Esta accion no se puede deshacer.`)) return;
    setDeletingSlug(post.slug);
    setError("");
    setCreatedSlug("");
    try {
      const response = await fetch("/api/admin/posts", { method: "DELETE", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ slug: post.slug }) });
      const result = await response.json() as { deleted?: boolean; error?: string };
      if (!response.ok || !result.deleted) throw new Error(result.error || "No se pudo eliminar el articulo.");
      setPosts(current => current.filter(item => item.slug !== post.slug));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo eliminar el articulo.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setDeletingSlug("");
    }
  }

  function logout() {
    setAuthenticated(false);
    setPassword("");
    setError("");
    setCreatedSlug("");
    setPosts([]);
  }

  return <main className="admin-page"><div className={`admin-shell ${!authenticated ? "admin-login-shell" : ""}`}>
    <div className="admin-top"><Link href="/#constelaciones"><ArrowLeft /> Volver a constelaciones</Link>{authenticated ? <button className="admin-logout" type="button" onClick={logout}><LogOut /> Cerrar sesion</button> : <span><LockKeyhole /> Acceso editorial</span>}</div>
    {!authenticated ? <>
      <header><span className="kicker">THE STARDUST NETWORK - ADMIN</span><h1>Acceso editorial</h1><p>Ingresa tus credenciales para administrar y publicar articulos.</p></header>
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form admin-login-form" onSubmit={login}><section><h2>Iniciar sesion</h2><label>Usuario<input required value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Usuario de administrador" /></label><label>Contrasena<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Contrasena" /></label></section><button className="button-primary" disabled={sending} type="submit">{sending ? "Validando..." : "Ingresar"} {!sending && <LogIn />}</button></form>
    </> : <>
      <header><span className="kicker">THE STARDUST NETWORK - ADMIN</span><h1>Nuevo articulo</h1><p>Selecciona la constelacion tematica en la que aparecera el articulo.</p></header>
      {createdSlug && <div className="admin-success"><Check /><div><b>Articulo publicado</b><span>Ya esta disponible dentro de la constelacion seleccionada.</span></div><Link href={`/blog/${createdSlug}`}>Ver articulo <Eye /></Link></div>}
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form" onSubmit={submit}>
        <section><h2>Informacion principal</h2><label>Constelacion<select name="constellation" required defaultValue=""><option value="" disabled>Selecciona donde publicar</option>{constellations.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select><small>El articulo aparecera automaticamente dentro de esta constelacion.</small></label><label>Titulo<input name="title" required minLength={5} maxLength={140} placeholder="Titulo del articulo" /></label><div className="admin-row admin-row-two"><label>Fecha<input name="date" type="date" required /></label><label>Tiempo de lectura<input name="readTime" required maxLength={20} placeholder="6 min" /></label></div><label>Resumen<textarea name="summary" required minLength={10} maxLength={300} rows={3} placeholder="Una introduccion breve para la tarjeta." /></label></section>
        <section><h2>Contenido</h2><label>Texto del articulo <small>Puedes pegar texto desde Word o Google Docs. Se conservaran negritas, cursivas, subtitulos, listas y citas.</small><div ref={editorRef} className="admin-rich-editor" contentEditable role="textbox" aria-label="Texto del articulo" data-placeholder="Escribe o pega aqui el contenido del articulo." /></label><label>Imagen <small>Opcional - JPG, PNG o WebP de hasta 5 MB. Si no seleccionas una, se mantendra la imagen predeterminada.</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImageFile(event.target.files?.[0] || null)} /></label></section>
        <button className="button-primary" disabled={sending} type="submit">{sending ? "Publicando..." : "Publicar articulo"} {!sending && <Send />}</button>
      </form>
      <section className="admin-posts">
        <div className="admin-posts-head"><div><span className="kicker">PUBLICADOS</span><h2>Articulos existentes</h2></div><button type="button" onClick={loadPosts} disabled={loadingPosts}><RefreshCw /> {loadingPosts ? "Cargando..." : "Actualizar"}</button></div>
        {posts.length ? <div className="admin-post-list">{posts.map(post => <article className="admin-post-item" key={post.slug}><div><b>{post.title}</b><span>{post.category} - {post.date}</span></div><div className="admin-post-actions"><Link href={`/blog/${post.slug}`}><Eye /> Ver</Link><button type="button" onClick={() => deletePost(post)} disabled={deletingSlug === post.slug}><Trash2 /> {deletingSlug === post.slug ? "Eliminando..." : "Eliminar"}</button></div></article>)}</div> : <p className="admin-empty">{loadingPosts ? "Cargando articulos..." : "Todavia no hay articulos para mostrar."}</p>}
      </section>
    </>}
  </div></main>;
}
