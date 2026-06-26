"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, Check, Download, Edit3, Eye, FilePlus2, FileSpreadsheet, Layers3, List, LockKeyhole, LogIn, LogOut, Plus, RefreshCw, Search, Send, Trash2, UsersRound, X } from "lucide-react";
import Link from "next/link";
import type { Constellation, Post, Signal } from "@/lib/types";

type AdminView = "create" | "posts" | "constellations" | "signals";
type PostsResponse = { posts?: Post[]; error?: string };
type ConstellationsResponse = { constellations?: Constellation[]; error?: string };
type SignalsResponse = { signals?: Signal[]; total?: number; page?: number; pageSize?: number; totalPages?: number; interests?: string[]; error?: string };

export function AdminPostForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const constellationFormRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<AdminView>("create");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingConstellations, setLoadingConstellations] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState("");
  const [deletingConstellationSlug, setDeletingConstellationSlug] = useState("");
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingConstellation, setEditingConstellation] = useState<Constellation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalInterests, setSignalInterests] = useState<string[]>([]);
  const [signalSearch, setSignalSearch] = useState("");
  const [signalInterest, setSignalInterest] = useState("");
  const [signalDateFrom, setSignalDateFrom] = useState("");
  const [signalDateTo, setSignalDateTo] = useState("");
  const [signalPage, setSignalPage] = useState(1);
  const [signalTotal, setSignalTotal] = useState(0);
  const [signalTotalPages, setSignalTotalPages] = useState(1);
  const [signalPageSize, setSignalPageSize] = useState(10);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [constellationImageFile, setConstellationImageFile] = useState<File | null>(null);

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

  function inputDate(post: Post) {
    if (post.publishedAt && /^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt)) return post.publishedAt;
    const months: Record<string, string> = { ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06", jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12" };
    const [day, rawMonth, year] = post.date.trim().toLowerCase().split(/\s+/);
    const month = months[rawMonth?.slice(0, 3)];
    if (!day || !month || !/^\d{4}$/.test(year)) return "";
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  function resetArticleForm() {
    formRef.current?.reset();
    if (editorRef.current) editorRef.current.innerHTML = "";
    setImageFile(null);
    setEditingPost(null);
  }

  function resetConstellationForm() {
    constellationFormRef.current?.reset();
    setConstellationImageFile(null);
    setEditingConstellation(null);
  }

  function clearMessages() {
    setError("");
    setCreatedSlug("");
    setSuccessMessage("");
  }

  function switchView(nextView: AdminView) {
    setView(nextView);
    clearMessages();
    if (nextView === "create") resetConstellationForm();
    if (nextView === "constellations") resetArticleForm();
  }

  function startEdit(post: Post) {
    const form = formRef.current;
    if (!form) return;
    setView("create");
    setEditingPost(post);
    clearMessages();
    setImageFile(null);
    (form.elements.namedItem("constellation") as HTMLSelectElement).value = post.constellation;
    (form.elements.namedItem("title") as HTMLInputElement).value = post.title;
    (form.elements.namedItem("date") as HTMLInputElement).value = inputDate(post);
    (form.elements.namedItem("readTime") as HTMLInputElement).value = post.readTime;
    (form.elements.namedItem("summary") as HTMLTextAreaElement).value = post.summary;
    const imageInput = form.elements.namedItem("imageFile") as HTMLInputElement | null;
    if (imageInput) imageInput.value = "";
    if (editorRef.current) editorRef.current.innerHTML = post.content.join("");
    setTimeout(() => form.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function startEditConstellation(constellation: Constellation) {
    const form = constellationFormRef.current;
    if (!form) return;
    setView("constellations");
    setEditingConstellation(constellation);
    clearMessages();
    setConstellationImageFile(null);
    (form.elements.namedItem("title") as HTMLInputElement).value = constellation.title;
    (form.elements.namedItem("subtitle") as HTMLInputElement).value = constellation.subtitle;
    (form.elements.namedItem("quote") as HTMLTextAreaElement).value = constellation.quote;
    (form.elements.namedItem("description") as HTMLTextAreaElement).value = constellation.description;
    const imageInput = form.elements.namedItem("imageFile") as HTMLInputElement | null;
    if (imageInput) imageInput.value = "";
    setTimeout(() => form.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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

  async function loadConstellations() {
    setLoadingConstellations(true);
    try {
      const response = await fetch("/api/admin/constellations", { headers: adminHeaders(), cache: "no-store" });
      const result = await response.json() as ConstellationsResponse;
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar las constelaciones.");
      setConstellations(result.constellations || []);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudieron cargar las constelaciones.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setLoadingConstellations(false);
    }
  }

  function signalParams(page = signalPage, format = "") {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(signalPageSize));
    if (signalSearch) params.set("search", signalSearch);
    if (signalInterest) params.set("interest", signalInterest);
    if (signalDateFrom) params.set("dateFrom", signalDateFrom);
    if (signalDateTo) params.set("dateTo", signalDateTo);
    if (format) params.set("format", format);
    return params;
  }

  async function loadSignals(page = signalPage) {
    setLoadingSignals(true);
    try {
      const response = await fetch(`/api/admin/signals?${signalParams(page).toString()}`, { headers: adminHeaders(), cache: "no-store" });
      const result = await response.json() as SignalsResponse;
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los registros.");
      setSignals(result.signals || []);
      setSignalPage(result.page || page);
      setSignalPageSize(result.pageSize || signalPageSize);
      setSignalTotal(result.total || 0);
      setSignalTotalPages(result.totalPages || 1);
      setSignalInterests(result.interests || []);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudieron cargar los registros.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setLoadingSignals(false);
    }
  }

  async function downloadSignals(format: "excel" | "pdf") {
    try {
      const response = await fetch(`/api/admin/signals?${signalParams(1, format).toString()}`, { headers: adminHeaders(), cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || "No se pudo descargar el archivo.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "excel" ? "senales-stardust.xls" : "senales-stardust.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo descargar el archivo.");
    }
  }

  async function uploadImage(file: File) {
    const uploadForm = new FormData();
    uploadForm.set("file", file);
    const uploadResponse = await fetch("/api/admin/upload", { method: "POST", headers: adminHeaders(), body: uploadForm });
    const uploadResult = await uploadResponse.json() as { url?: string; error?: string };
    if (!uploadResponse.ok || !uploadResult.url) throw new Error(uploadResult.error || "No se pudo subir la imagen.");
    return uploadResult.url;
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
      clearMessages();
      setTimeout(() => { void loadPosts(); void loadConstellations(); void loadSignals(1); }, 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesion.");
    } finally {
      setSending(false);
    }
  }

  async function submitArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = editorContentBlocks();
    const rawDate = String(form.get("date") || "");
    const date = rawDate ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rawDate}T00:00:00Z`)) : "";
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    body.date = date;
    body.publishedAt = rawDate;
    setSending(true);
    clearMessages();
    try {
      if (!content.length) throw new Error("Escribe el contenido del articulo.");
      if (editingPost) body.image = editingPost.image;
      if (imageFile) body.image = await uploadImage(imageFile);
      const response = await fetch("/api/admin/posts", {
        method: editingPost ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ ...body, slug: editingPost?.slug, content }),
      });
      const result = await response.json() as { slug?: string; error?: string };
      if (!response.ok) throw new Error(result.error || (editingPost ? "No se pudo actualizar el articulo." : "No se pudo publicar el articulo."));
      setCreatedSlug(result.slug || "");
      setSuccessMessage(editingPost ? "Articulo actualizado" : "Articulo publicado");
      resetArticleForm();
      await loadPosts();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo crear el articulo.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setSending(false);
    }
  }

  async function submitConstellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    setSending(true);
    clearMessages();
    try {
      if (editingConstellation) body.image = editingConstellation.image;
      if (constellationImageFile) body.image = await uploadImage(constellationImageFile);
      const response = await fetch("/api/admin/constellations", {
        method: editingConstellation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ ...body, slug: editingConstellation?.slug }),
      });
      const result = await response.json() as Constellation & { error?: string };
      if (!response.ok) throw new Error(result.error || (editingConstellation ? "No se pudo actualizar la constelacion." : "No se pudo crear la constelacion."));
      setSuccessMessage(editingConstellation ? "Constelacion actualizada" : "Constelacion creada");
      resetConstellationForm();
      await loadConstellations();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo guardar la constelacion.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setSending(false);
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`Eliminar "${post.title}"? Esta accion no se puede deshacer.`)) return;
    setDeletingSlug(post.slug);
    clearMessages();
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

  async function deleteConstellation(constellation: Constellation) {
    if (!window.confirm(`Eliminar "${constellation.title}"? Los articulos asociados dejaran de tener una constelacion visible.`)) return;
    setDeletingConstellationSlug(constellation.slug);
    clearMessages();
    try {
      const response = await fetch("/api/admin/constellations", { method: "DELETE", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ slug: constellation.slug }) });
      const result = await response.json() as { deleted?: boolean; error?: string };
      if (!response.ok || !result.deleted) throw new Error(result.error || "No se pudo eliminar la constelacion.");
      setConstellations(current => current.filter(item => item.slug !== constellation.slug));
      if (editingConstellation?.slug === constellation.slug) resetConstellationForm();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo eliminar la constelacion.";
      setError(message);
      if (message.includes("sesion")) setAuthenticated(false);
    } finally {
      setDeletingConstellationSlug("");
    }
  }

  function logout() {
    setAuthenticated(false);
    setPassword("");
    setError("");
    setCreatedSlug("");
    setSuccessMessage("");
    setPosts([]);
    setConstellations([]);
    setSignals([]);
    setSignalInterests([]);
    setSignalSearch("");
    setSignalInterest("");
    setSignalDateFrom("");
    setSignalDateTo("");
    setSignalPage(1);
    setSignalTotal(0);
    setSignalTotalPages(1);
    resetArticleForm();
    resetConstellationForm();
  }

  return <main className="admin-page"><div className={`admin-shell ${!authenticated ? "admin-login-shell" : ""}`}>
    <div className="admin-top"><Link href="/#constelaciones"><ArrowLeft /> Volver a constelaciones</Link>{authenticated ? <button className="admin-logout" type="button" onClick={logout}><LogOut /> Cerrar sesion</button> : <span><LockKeyhole /> Acceso editorial</span>}</div>
    {!authenticated ? <>
      <header><span className="kicker">THE STARDUST NETWORK - ADMIN</span><h1>Acceso editorial</h1><p>Ingresa tus credenciales para administrar y publicar articulos.</p></header>
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form admin-login-form" onSubmit={login}><section><h2>Iniciar sesion</h2><label>Usuario<input required value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Usuario de administrador" /></label><label>Contrasena<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Contrasena" /></label></section><button className="button-primary" disabled={sending} type="submit">{sending ? "Validando..." : "Ingresar"} {!sending && <LogIn />}</button></form>
    </> : <>
      <header><span className="kicker">THE STARDUST NETWORK - ADMIN</span><h1>Panel editorial</h1><p>Administra articulos y constelaciones desde este menu.</p></header>
      <nav className="admin-menu" aria-label="Menu de administracion">
        <button type="button" className={view === "create" ? "active" : ""} onClick={() => switchView("create")}><FilePlus2 /> Crear nuevo articulo</button>
        <button type="button" className={view === "posts" ? "active" : ""} onClick={() => switchView("posts")}><List /> Ver articulos</button>
        <button type="button" className={view === "constellations" ? "active" : ""} onClick={() => switchView("constellations")}><Layers3 /> Ver constelaciones</button>
        <button type="button" className={view === "signals" ? "active" : ""} onClick={() => switchView("signals")}><UsersRound /> Ver registros</button>
      </nav>
      {createdSlug && <div className="admin-success"><Check /><div><b>{successMessage || "Articulo publicado"}</b><span>{successMessage === "Articulo actualizado" ? "Los cambios fueron guardados." : "Ya esta disponible dentro de la constelacion seleccionada."}</span></div><Link href={`/blog/${createdSlug}`}>Ver articulo <Eye /></Link></div>}
      {successMessage && !createdSlug && <div className="admin-success"><Check /><div><b>{successMessage}</b><span>Los cambios fueron guardados.</span></div></div>}
      {error && <div className="admin-error">{error}</div>}

      {view === "create" && <form ref={formRef} className="admin-form" onSubmit={submitArticle}>
        <section><h2>{editingPost ? "Editar articulo" : "Crear nuevo articulo"}</h2><label>Constelacion<select name="constellation" required defaultValue=""><option value="" disabled>Selecciona donde publicar</option>{constellations.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select><small>El articulo aparecera automaticamente dentro de esta constelacion.</small></label><label>Titulo<input name="title" required minLength={5} maxLength={140} placeholder="Titulo del articulo" /></label><div className="admin-row admin-row-two"><label>Fecha<input name="date" type="date" required /></label><label>Tiempo de lectura<input name="readTime" required maxLength={20} placeholder="6 min" /></label></div><label>Resumen<textarea name="summary" required minLength={10} maxLength={300} rows={3} placeholder="Una introduccion breve para la tarjeta." /></label></section>
        <section><h2>Contenido</h2><label>Texto del articulo <small>Puedes pegar texto desde Word o Google Docs. Se conservaran negritas, cursivas, subtitulos, listas y citas.</small><div ref={editorRef} className="admin-rich-editor" contentEditable role="textbox" aria-label="Texto del articulo" data-placeholder="Escribe o pega aqui el contenido del articulo." /></label><label>Imagen <small>{editingPost ? "Opcional: selecciona una imagen solo si deseas reemplazar la actual." : "Opcional: JPG, PNG o WebP de hasta 5 MB."}</small><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImageFile(event.target.files?.[0] || null)} /></label></section>
        <div className="admin-form-actions">{editingPost && <button className="admin-cancel-edit" type="button" onClick={() => { resetArticleForm(); clearMessages(); }}><X /> Cancelar edicion</button>}<button className="button-primary" disabled={sending} type="submit">{sending ? editingPost ? "Guardando..." : "Publicando..." : editingPost ? "Guardar cambios" : "Publicar articulo"} {!sending && <Send />}</button></div>
      </form>}

      {view === "posts" && <section className="admin-posts">
        <div className="admin-posts-head"><div><span className="kicker">PUBLICADOS</span><h2>Articulos existentes</h2></div><button type="button" onClick={loadPosts} disabled={loadingPosts}><RefreshCw /> {loadingPosts ? "Cargando..." : "Actualizar"}</button></div>
        {posts.length ? <div className="admin-post-list">{posts.map(post => <article className="admin-post-item" key={post.slug}><div><b>{post.title}</b><span>{post.category} - {post.date}</span></div><div className="admin-post-actions"><Link href={`/blog/${post.slug}`}><Eye /> Ver</Link><button className="admin-edit-post" type="button" onClick={() => startEdit(post)}><Edit3 /> Editar</button><button type="button" onClick={() => deletePost(post)} disabled={deletingSlug === post.slug}><Trash2 /> {deletingSlug === post.slug ? "Eliminando..." : "Eliminar"}</button></div></article>)}</div> : <p className="admin-empty">{loadingPosts ? "Cargando articulos..." : "Todavia no hay articulos para mostrar."}</p>}
      </section>}

      {view === "constellations" && <>
        <form ref={constellationFormRef} className="admin-form" onSubmit={submitConstellation}>
          <section><h2>{editingConstellation ? "Editar constelacion" : "Agregar constelacion"}</h2><label>Titulo<input name="title" required minLength={3} maxLength={120} placeholder="Nombre de la constelacion" /></label><label>Subtitulo<input name="subtitle" required minLength={3} maxLength={160} placeholder="Frase corta de apoyo" /></label><label>Cita<textarea name="quote" maxLength={260} rows={2} placeholder="Cita o frase destacada" /></label><label>Descripcion<textarea name="description" required minLength={10} maxLength={420} rows={4} placeholder="Describe el proposito de la constelacion." /></label><label>Imagen <small>{editingConstellation ? "Opcional: selecciona una imagen solo si deseas reemplazar la actual." : "Opcional: si no subes una, se usara la imagen predeterminada."}</small><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setConstellationImageFile(event.target.files?.[0] || null)} /></label></section>
          <div className="admin-form-actions">{editingConstellation && <button className="admin-cancel-edit" type="button" onClick={() => { resetConstellationForm(); clearMessages(); }}><X /> Cancelar edicion</button>}<button className="button-primary" disabled={sending} type="submit">{sending ? editingConstellation ? "Guardando..." : "Creando..." : editingConstellation ? "Guardar constelacion" : "Agregar constelacion"} {!sending && <Plus />}</button></div>
        </form>
        <section className="admin-posts">
          <div className="admin-posts-head"><div><span className="kicker">CONSTELACIONES</span><h2>Constelaciones existentes</h2></div><button type="button" onClick={loadConstellations} disabled={loadingConstellations}><RefreshCw /> {loadingConstellations ? "Cargando..." : "Actualizar"}</button></div>
          {constellations.length ? <div className="admin-post-list">{constellations.map(item => <article className="admin-post-item" key={item.slug}><div><b>{item.title}</b><span>{item.subtitle}</span></div><div className="admin-post-actions"><Link href={`/constelaciones/${item.slug}`}><Eye /> Ver</Link><button className="admin-edit-post" type="button" onClick={() => startEditConstellation(item)}><Edit3 /> Editar</button><button type="button" onClick={() => deleteConstellation(item)} disabled={deletingConstellationSlug === item.slug}><Trash2 /> {deletingConstellationSlug === item.slug ? "Eliminando..." : "Eliminar"}</button></div></article>)}</div> : <p className="admin-empty">{loadingConstellations ? "Cargando constelaciones..." : "Todavia no hay constelaciones para mostrar."}</p>}
        </section>
      </>}

      {view === "signals" && <section className="admin-posts">
        <div className="admin-posts-head"><div><span className="kicker">FORMULARIO UNIRME</span><h2>Registros recibidos</h2></div><div className="admin-download-actions"><button type="button" onClick={() => downloadSignals("excel")}><FileSpreadsheet /> Excel</button><button type="button" onClick={() => downloadSignals("pdf")}><Download /> PDF</button></div></div>
        <form className="admin-filters" onSubmit={event => { event.preventDefault(); void loadSignals(1); }}>
          <label>Buscar<input value={signalSearch} onChange={event => setSignalSearch(event.target.value)} placeholder="Nombre, correo o mensaje" /></label>
          <label>Constelacion<select value={signalInterest} onChange={event => setSignalInterest(event.target.value)}><option value="">Todas</option>{signalInterests.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Desde<input type="date" value={signalDateFrom} onChange={event => setSignalDateFrom(event.target.value)} /></label>
          <label>Hasta<input type="date" value={signalDateTo} onChange={event => setSignalDateTo(event.target.value)} /></label>
          <label>Por pagina<select value={signalPageSize} onChange={event => setSignalPageSize(Number(event.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
          <button type="submit" disabled={loadingSignals}><Search /> {loadingSignals ? "Buscando..." : "Filtrar"}</button>
        </form>
        <div className="admin-signal-summary"><span>{signalTotal} registros</span><button type="button" onClick={() => loadSignals(signalPage)} disabled={loadingSignals}><RefreshCw /> Actualizar</button></div>
        {signals.length ? <div className="admin-signal-table"><table><thead><tr><th>Fecha</th><th>Nombre</th><th>Correo</th><th>Constelacion</th><th>Mensaje</th></tr></thead><tbody>{signals.map(signal => <tr key={signal.id}><td>{signal.date}</td><td>{signal.name}</td><td><a href={`mailto:${signal.email}`}>{signal.email}</a></td><td>{signal.interest}</td><td>{signal.message}</td></tr>)}</tbody></table></div> : <p className="admin-empty">{loadingSignals ? "Cargando registros..." : "Todavia no hay registros para mostrar."}</p>}
        <div className="admin-pagination"><button type="button" disabled={loadingSignals || signalPage <= 1} onClick={() => loadSignals(signalPage - 1)}>Anterior</button><span>Pagina {signalPage} de {signalTotalPages}</span><button type="button" disabled={loadingSignals || signalPage >= signalTotalPages} onClick={() => loadSignals(signalPage + 1)}>Siguiente</button></div>
      </section>}
    </>}
  </div></main>;
}
