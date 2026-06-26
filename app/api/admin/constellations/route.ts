import { NextRequest, NextResponse } from "next/server";
import { getConstellations, saveConstellations } from "@/lib/constellations";
import type { Constellation } from "@/lib/types";
import { adminAuthConfigured, validAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function validRequestCredentials(request: NextRequest) {
  return validAdminCredentials(request.headers.get("x-admin-username") || "", request.headers.get("x-admin-password") || "");
}

function validImage(value: string) {
  return value.startsWith("/") || value.startsWith("https://") ? value : "/stardust-constellations.png";
}

function storageError(error: unknown) {
  const missing = error instanceof Error && error.message === "CONSTELLATION_STORAGE_NOT_CONFIGURED";
  return NextResponse.json({ error: missing ? "El almacenamiento de constelaciones no esta configurado." : "No se pudo guardar la constelacion." }, { status: missing ? 503 : 500 });
}

function ensureAdmin(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) return authError;

  try {
    const constellations = await getConstellations();
    return NextResponse.json({ constellations });
  } catch (error) {
    console.error("Could not load constellations", error);
    return NextResponse.json({ error: "No se pudieron cargar las constelaciones." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const title = text(body.title, 120);
    const subtitle = text(body.subtitle, 160);
    const quote = text(body.quote, 260);
    const description = text(body.description, 420);
    const image = validImage(text(body.image, 1000));

    if (title.length < 3 || subtitle.length < 3 || description.length < 10) {
      return NextResponse.json({ error: "Completa titulo, subtitulo y descripcion." }, { status: 400 });
    }

    const constellations = await getConstellations();
    const baseSlug = slugify(text(body.slug, 100) || title) || `constelacion-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 2;
    while (constellations.some(item => item.slug === slug)) slug = `${baseSlug}-${suffix++}`;

    const constellation: Constellation = { slug, title, subtitle, quote, description, image, relatedPosts: [] };
    await saveConstellations([...constellations, constellation]);
    return NextResponse.json(constellation, { status: 201 });
  } catch (error) {
    console.error("Could not create constellation", error);
    return storageError(error);
  }
}

export async function PUT(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const slug = text(body.slug, 100);
    const title = text(body.title, 120);
    const subtitle = text(body.subtitle, 160);
    const quote = text(body.quote, 260);
    const description = text(body.description, 420);
    const image = validImage(text(body.image, 1000));

    if (!slug) return NextResponse.json({ error: "Indica la constelacion que deseas editar." }, { status: 400 });
    if (title.length < 3 || subtitle.length < 3 || description.length < 10) {
      return NextResponse.json({ error: "Completa titulo, subtitulo y descripcion." }, { status: 400 });
    }

    const constellations = await getConstellations();
    let updated = false;
    const nextConstellations = constellations.map(item => {
      if (item.slug !== slug) return item;
      updated = true;
      return { ...item, title, subtitle, quote, description, image };
    });
    if (!updated) return NextResponse.json({ error: "No se encontro la constelacion." }, { status: 404 });

    await saveConstellations(nextConstellations);
    return NextResponse.json(nextConstellations.find(item => item.slug === slug));
  } catch (error) {
    console.error("Could not update constellation", error);
    return storageError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const slug = text(body.slug, 100);
    if (!slug) return NextResponse.json({ error: "Indica la constelacion que deseas eliminar." }, { status: 400 });

    const constellations = await getConstellations();
    const kept = constellations.filter(item => item.slug !== slug);
    if (kept.length === constellations.length) return NextResponse.json({ error: "No se encontro la constelacion." }, { status: 404 });

    await saveConstellations(kept);
    return NextResponse.json({ deleted: true, slug });
  } catch (error) {
    console.error("Could not delete constellation", error);
    return storageError(error);
  }
}
