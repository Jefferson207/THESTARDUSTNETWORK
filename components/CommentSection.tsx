"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Comment } from "@/lib/types";

export function CommentSection({ postSlug, initialComments, context = "contenido" }: { postSlug: string; initialComments: Comment[]; context?: "contenido" | "reflexión" }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<Comment[]>; })
      .then(setComments)
      .catch(() => { if (!controller.signal.aborted) setError("No pudimos actualizar los comentarios."); });
    return () => controller.abort();
  }, [postSlug]);

  useEffect(() => {
    if (!modalOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setModalOpen(false); };
    document.body.style.overflow = "hidden";
    addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; removeEventListener("keydown", close); };
  }, [modalOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setError(""); setPublished(false);
    try {
      const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postSlug, name, message }) });
      const result = await response.json() as Comment & { error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo publicar el comentario.");
      setComments(current => [...current, result]);
      setName(""); setMessage(""); setPublished(true);
      if (context === "contenido") setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo publicar el comentario.");
    } finally { setSending(false); }
  }

  const constellationConversation = context === "contenido";
  const visibleComments = constellationConversation ? [...comments].reverse() : comments;
  const commentForm = <form className="comment-form" onSubmit={submit}><span className="kicker">DEJA TU HUELLA</span><h3>Súmate a la conversación</h3>{published && <p className="comment-success">Tu comentario fue publicado y guardado en la comunidad.</p>}{error && <p className="comment-error">{error}</p>}<label>Tu nombre<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="¿Cómo te llamas?" /></label><label>Tu comentario<textarea required minLength={3} maxLength={800} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribe aquí lo que piensas..." /></label><div><small>{message.length}/800 caracteres</small><button className="button-primary" type="submit" disabled={sending}>{sending ? "Publicando..." : "Publicar comentario"} {!sending && <Send size={16} />}</button></div></form>;
  return <section className={`comments ${constellationConversation ? "constellation-comments" : ""}`}>
    {constellationConversation ? <div className="echoes-toolbar"><div className="echoes-heading"><MessageCircle size={13} /><span>ECOS DE LA COMUNIDAD</span></div><button className="open-comment-modal" type="button" onClick={() => { setPublished(false); setModalOpen(true); }}><MessageCircle size={15} /> Dejar comentario</button></div> : <><h2><MessageCircle /> Conversación <span>{comments.length}</span></h2><p className="comments-intro">Comparte lo que esta reflexión despertó en ti. Este es un espacio de respeto y escucha.</p></>}
    {constellationConversation
      ? <div className="echoes-list">{[0, 1].map(column => <div className="echo-column" key={column}>{visibleComments.filter((_, index) => index % 2 === column).map((comment, index) => <blockquote className="echo-card" key={`${comment.name}-${comment.date}-${index}`}><p>“{comment.message}”</p><footer><strong>{comment.name}</strong><span>·</span><time>{comment.date}</time></footer></blockquote>)}</div>)}</div>
      : <div>{visibleComments.map((comment, index) => <div className="comment" key={`${comment.name}-${comment.date}-${index}`}><span>{comment.name[0]?.toUpperCase()}</span><div><b>{comment.name}</b><small>{comment.date}</small><p>{comment.message}</p></div></div>)}</div>}
    {constellationConversation ? modalOpen && <div className="comment-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModalOpen(false); }}><div className="comment-modal" role="dialog" aria-modal="true" aria-label="Dejar un comentario"><button className="close-comment-modal" type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X /></button>{commentForm}</div></div> : commentForm}
  </section>;
}
