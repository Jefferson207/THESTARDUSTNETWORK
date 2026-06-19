"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { Comment } from "@/lib/types";

export function CommentSection({ postSlug, initialComments }: { postSlug: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`, { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<Comment[]> : Promise.reject())
      .then(setComments)
      .catch(() => { if (!controller.signal.aborted) setError("No pudimos actualizar los comentarios."); });
    return () => controller.abort();
  }, [postSlug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setPublished(false);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, name, message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setComments(current => [...current, result as Comment]);
      setName("");
      setMessage("");
      setPublished(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo publicar el comentario.");
    } finally {
      setSending(false);
    }
  }

  return <section className="comments">
    <h2><MessageCircle/> Conversación <span>{comments.length}</span></h2>
    <p className="comments-intro">Comparte lo que esta reflexión despertó en ti. Este es un espacio de respeto y escucha.</p>
    {comments.map((comment, index) => <div className="comment" key={`${comment.name}-${comment.date}-${index}`}><span>{comment.name[0]?.toUpperCase()}</span><div><b>{comment.name}</b><small>{comment.date}</small><p>{comment.message}</p></div></div>)}
    <form className="comment-form" onSubmit={submit}>
      <span className="kicker">DEJA TU HUELLA</span>
      <h3>Súmate a la conversación</h3>
      {published && <p className="comment-success">Tu comentario fue publicado y guardado en la comunidad.</p>}
      {error && <p className="comment-error">{error}</p>}
      <label>Tu nombre<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="¿Cómo te llamas?" /></label>
      <label>Tu comentario<textarea required minLength={3} maxLength={800} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribe aquí lo que piensas..." /></label>
      <div><small>{message.length}/800 caracteres</small><button className="button-primary" type="submit" disabled={sending}>{sending ? "Publicando..." : "Publicar comentario"} {!sending && <Send size={16}/>}</button></div>
    </form>
  </section>;
}
