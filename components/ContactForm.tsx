"use client";
import { Check, Send } from "lucide-react";
import { FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSent(true); }
  if (sent) return <div className="success"><span><Check/></span><h3>Tu señal llegó</h3><p>Gracias por querer ser parte. Muy pronto nos pondremos en contacto contigo.</p><button onClick={() => setSent(false)}>Enviar otro mensaje</button></div>;
  return <form className="contact-form" onSubmit={submit}><div className="form-row"><label>Nombre<input required name="name" placeholder="¿Cómo te llamas?" /></label><label>Correo<input required type="email" name="email" placeholder="tu@correo.com" /></label></div><label>¿Qué te trae por aquí?<select name="interest" defaultValue=""><option value="" disabled>Elige una opción</option><option>Quiero unirme a la comunidad</option><option>Me interesan los eventos</option><option>Quiero colaborar</option><option>Solo quiero saludar</option></select></label><label>Tu mensaje<textarea required name="message" rows={4} placeholder="Cuéntanos un poco sobre ti..." /></label><button className="button-primary" type="submit">Enviar mi señal <Send size={17}/></button><small>Al enviar aceptas nuestra política de privacidad. Sin spam, lo prometemos.</small></form>;
}
