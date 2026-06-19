"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Check, Eye, LockKeyhole, Send } from "lucide-react";
import Link from "next/link";

export function AdminPostForm() {
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSending(true); setError(""); setCreatedSlug("");
    const form = new FormData(formElement);
    const content = String(form.get("content") || "").split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
    const rawDate = String(form.get("date") || "");
    const date = rawDate ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rawDate}T00:00:00Z`)) : "";
    const body = Object.fromEntries(form.entries());
    body.date = date;

    try {
      const response = await fetch("/api/admin/posts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ ...body, content }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCreatedSlug(result.slug);
      formElement.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear la reflexión.");
    } finally { setSending(false); }
  }

  return <main className="admin-page"><div className="admin-shell">
    <div className="admin-top"><Link href="/#reflexiones"><ArrowLeft/> Volver al blog</Link><span><LockKeyhole/> Panel editorial</span></div>
    <header><span className="kicker">THE STARDUST NETWORK · ADMIN</span><h1>Nueva reflexión</h1><p>Publica una nueva idea en “Reflexiones para tu viaje”. Los cambios aparecerán inmediatamente.</p></header>
    {createdSlug && <div className="admin-success"><Check/><div><b>Reflexión publicada</b><span>Ya está disponible para todos los visitantes.</span></div><Link href={`/blog/${createdSlug}`}>Ver publicación <Eye/></Link></div>}
    {error && <div className="admin-error">{error}</div>}
    <form className="admin-form" onSubmit={submit}>
      <section><h2>Acceso</h2><label>Contraseña de administrador<input type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="ADMIN_PASSWORD" autoComplete="current-password" /></label></section>
      <section><h2>Información principal</h2><label>Título<input name="title" required minLength={5} maxLength={140} placeholder="El título de tu reflexión" /></label><div className="admin-row"><label>Categoría<input name="category" required maxLength={50} placeholder="Reflexión" /></label><label>Fecha<input name="date" type="date" required /></label><label>Tiempo de lectura<input name="readTime" required maxLength={20} placeholder="6 min" /></label></div><label>Resumen<textarea name="summary" required minLength={10} maxLength={300} rows={3} placeholder="Una introducción breve que aparecerá en la tarjeta del blog." /></label></section>
      <section><h2>Contenido</h2><label>Texto de la reflexión<textarea name="content" required rows={13} placeholder={'Escribe el primer párrafo.\n\nSepara cada párrafo con una línea vacía.\n\nPuedes escribir hasta 30 párrafos.'} /></label><label>Ruta de imagen del proyecto <small>Opcional</small><input name="image" placeholder="/stardust-hero.png" /></label></section>
      <button className="button-primary" disabled={sending} type="submit">{sending ? "Publicando..." : "Publicar reflexión"} {!sending && <Send/>}</button>
    </form>
  </div></main>;
}
