"use client";
import { FormEvent, useState } from "react";
import { ArrowLeft, Check, Eye, LockKeyhole, LogIn, LogOut, Send } from "lucide-react";
import Link from "next/link";
import constellations from "@/data/constellations.json";

export function AdminPostForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError("");
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const result = await response.json() as { authenticated?: boolean; error?: string };
      if (!response.ok || !result.authenticated) throw new Error(result.error || "No se pudo iniciar sesión.");
      setAuthenticated(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión."); }
    finally { setSending(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = String(form.get("content") || "").split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
    const rawDate = String(form.get("date") || "");
    const date = rawDate ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rawDate}T00:00:00Z`)) : "";
    const body = Object.fromEntries(form.entries()); body.date = date; body.publishedAt = rawDate;
    setSending(true); setError(""); setCreatedSlug("");
    try {
      if (imageFile) {
        const uploadForm = new FormData(); uploadForm.set("file", imageFile);
        const uploadResponse = await fetch("/api/admin/upload", { method: "POST", headers: { "x-admin-username": username, "x-admin-password": password }, body: uploadForm });
        const uploadResult = await uploadResponse.json() as { url?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.url) throw new Error(uploadResult.error || "No se pudo subir la imagen.");
        body.image = uploadResult.url;
      }
      const response = await fetch("/api/admin/posts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-username": username, "x-admin-password": password }, body: JSON.stringify({ ...body, content }) });
      const result = await response.json() as { slug?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo publicar el artículo.");
      setCreatedSlug(result.slug || ""); formElement.reset(); setImageFile(null);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo crear el artículo.";
      setError(message);
      if (message.includes("sesión")) setAuthenticated(false);
    } finally { setSending(false); }
  }

  function logout() { setAuthenticated(false); setPassword(""); setError(""); setCreatedSlug(""); }

  return <main className="admin-page"><div className={`admin-shell ${!authenticated ? "admin-login-shell" : ""}`}>
    <div className="admin-top"><Link href="/#constelaciones"><ArrowLeft /> Volver a constelaciones</Link>{authenticated ? <button className="admin-logout" type="button" onClick={logout}><LogOut /> Cerrar sesión</button> : <span><LockKeyhole /> Acceso editorial</span>}</div>
    {!authenticated ? <>
      <header><span className="kicker">THE STARDUST NETWORK · ADMIN</span><h1>Acceso editorial</h1><p>Ingresa tus credenciales para administrar y publicar artículos.</p></header>
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form admin-login-form" onSubmit={login}><section><h2>Iniciar sesión</h2><label>Usuario<input required value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Usuario de administrador" /></label><label>Contraseña<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Contraseña" /></label></section><button className="button-primary" disabled={sending} type="submit">{sending ? "Validando..." : "Ingresar"} {!sending && <LogIn />}</button></form>
    </> : <>
      <header><span className="kicker">THE STARDUST NETWORK · ADMIN</span><h1>Nuevo artículo</h1><p>Selecciona la constelación temática en la que aparecerá el artículo.</p></header>
      {createdSlug && <div className="admin-success"><Check /><div><b>Artículo publicado</b><span>Ya está disponible dentro de la constelación seleccionada.</span></div><Link href={`/blog/${createdSlug}`}>Ver artículo <Eye /></Link></div>}
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form" onSubmit={submit}>
        <section><h2>Información principal</h2><label>Constelación<select name="constellation" required defaultValue=""><option value="" disabled>Selecciona dónde publicar</option>{constellations.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select><small>El artículo aparecerá automáticamente dentro de esta constelación.</small></label><label>Título<input name="title" required minLength={5} maxLength={140} placeholder="Título del artículo" /></label><div className="admin-row admin-row-two"><label>Fecha<input name="date" type="date" required /></label><label>Tiempo de lectura<input name="readTime" required maxLength={20} placeholder="6 min" /></label></div><label>Resumen<textarea name="summary" required minLength={10} maxLength={300} rows={3} placeholder="Una introducción breve para la tarjeta." /></label></section>
        <section><h2>Contenido</h2><label>Texto del artículo<textarea name="content" required rows={13} placeholder={'Escribe el primer párrafo.\n\nSepara cada párrafo con una línea vacía.\n\nPuedes escribir hasta 30 párrafos.'} /></label><label>Imagen <small>Opcional · JPG, PNG o WebP de hasta 5 MB. Si no seleccionas una, se mantendrá la imagen predeterminada.</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImageFile(event.target.files?.[0] || null)} /></label></section>
        <button className="button-primary" disabled={sending} type="submit">{sending ? "Publicando..." : "Publicar artículo"} {!sending && <Send />}</button>
      </form>
    </>}
  </div></main>;
}
