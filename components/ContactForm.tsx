"use client";
import { Check, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Constellation } from "@/lib/types";

export function ContactForm({ constellations }: { constellations: Constellation[] }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo enviar tu senal.");
      e.currentTarget.reset();
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo enviar tu senal.");
    } finally {
      setSending(false);
    }
  }

  if (sent) return <div className="success"><span><Check /></span><h3>Tu senal llego</h3><p>Gracias por querer ser parte. Muy pronto nos pondremos en contacto contigo.</p><button onClick={() => setSent(false)}>Enviar otro mensaje</button></div>;
  return <form className="contact-form" onSubmit={submit}><div className="form-row"><label>Nombre<input required name="name" maxLength={80} placeholder="Como te llamas?" /></label><label>Correo<input required type="email" name="email" maxLength={160} placeholder="tu@correo.com" /></label></div><label>Que constelacion te llama?<select name="interest" required defaultValue=""><option value="" disabled>Elige una opcion</option>{constellations.map(item => <option value={item.title} key={item.slug}>{item.title}</option>)}</select></label><label>Tu mensaje<textarea required name="message" minLength={3} maxLength={1200} rows={4} placeholder="Cuentanos un poco sobre ti..." /></label>{error && <p className="comment-error">{error}</p>}<button className="button-primary" type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar mi senal"} {!sending && <Send size={17} />}</button><small>Al enviar aceptas nuestra politica de privacidad. Sin spam, lo prometemos.</small></form>;
}
