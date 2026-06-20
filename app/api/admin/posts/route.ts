import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { getPosts, postsPath } from "@/lib/posts";
import type { Post } from "@/lib/types";
import constellations from "@/data/constellations.json";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL; const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN; let writeQueue = Promise.resolve();
function text(value: unknown, maxLength: number) { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100); }
async function storePost(post: Post) {
  if (redisUrl && redisToken) { const response = await fetch(redisUrl, { method: "POST", headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" }, body: JSON.stringify(["LPUSH", "stardust:posts", JSON.stringify(post)]), cache: "no-store" }); if (!response.ok) throw new Error(`POST_STORAGE_${response.status}`); const payload = await response.json() as { error?: string }; if (payload.error) throw new Error(payload.error); return; }
  if (process.env.VERCEL) throw new Error("POST_STORAGE_NOT_CONFIGURED"); let writeError: unknown; writeQueue = writeQueue.then(async () => { try { const posts = await getPosts(); posts.unshift(post); await writeFile(postsPath, `${JSON.stringify(posts, null, 2)}\n`, "utf8"); } catch (error) { writeError = error; } }); await writeQueue; if (writeError) throw writeError;
}
export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD; if (!configuredPassword) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 }); if (request.headers.get("x-admin-password") !== configuredPassword) return NextResponse.json({ error: "Contraseña de administrador incorrecta." }, { status: 401 });
  try { const body = await request.json(); const title = text(body.title, 140); const constellationSlug = text(body.constellation, 100); const selected = constellations.find(item => item.slug === constellationSlug); const summary = text(body.summary, 300); const date = text(body.date, 40); const readTime = text(body.readTime, 20); const requestedImage = text(body.image, 300); const image = requestedImage.startsWith("/") ? requestedImage : selected?.image || "/stardust-hero.png"; const content = Array.isArray(body.content) ? body.content.map((item: unknown) => text(item, 3000)).filter(Boolean).slice(0, 30) : [];
    if (title.length < 5 || !selected || summary.length < 10 || !date || !readTime || !content.length) return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    const posts = await getPosts(); const baseSlug = slugify(title) || `publicacion-${Date.now()}`; let slug = baseSlug; let suffix = 2; while (posts.some(post => post.slug === slug)) slug = `${baseSlug}-${suffix++}`;
    const post: Post = { slug, constellation: selected.slug, title, image, date, category: selected.title, summary, readTime, content }; await storePost(post); return NextResponse.json(post, { status: 201 });
  } catch (error) { console.error("Could not save post", error); const missing = error instanceof Error && error.message === "POST_STORAGE_NOT_CONFIGURED"; return NextResponse.json({ error: missing ? "El almacenamiento de publicaciones no está configurado." : "No se pudo guardar la publicación." }, { status: missing ? 503 : 500 }); }
}
