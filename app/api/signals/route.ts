import { NextRequest, NextResponse } from "next/server";
import { storeSignal } from "@/lib/signals";
import type { Signal } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 80);
    const email = clean(body.email, 160).toLowerCase();
    const interest = clean(body.interest, 140);
    const message = clean(body.message, 1200);

    if (name.length < 2 || !validEmail(email) || !interest || message.length < 3) {
      return NextResponse.json({ error: "Completa correctamente tu nombre, correo, constelacion y mensaje." }, { status: 400 });
    }

    const now = new Date();
    const signal: Signal = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      email,
      interest,
      message,
      createdAt: now.toISOString(),
      date: new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(now),
    };

    await storeSignal(signal);
    return NextResponse.json({ sent: true }, { status: 201 });
  } catch (error) {
    console.error("Could not save signal", error);
    const missing = error instanceof Error && error.message === "SIGNAL_STORAGE_NOT_CONFIGURED";
    return NextResponse.json({ error: missing ? "El almacenamiento de mensajes no esta configurado." : "No se pudo enviar tu senal." }, { status: missing ? 503 : 500 });
  }
}
