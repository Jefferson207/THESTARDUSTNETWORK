import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { getPosts, postsPath } from "@/lib/posts";
import type { Post } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let writeQueue = Promise.resolve();

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (request.headers.get("x-admin-password") !== configuredPassword) return NextResponse.json({ error: "Contraseña de administrador incorrecta." }, { status: 401 });

  try {
    const body = await request.json();
    const title = text(body.title, 140);
    const category = text(body.category, 50);
    const summary = text(body.summary, 300);
    const date = text(body.date, 40);
    const readTime = text(body.readTime, 20);
    const requestedImage = text(body.image, 300);
    const image = requestedImage.startsWith("/") ? requestedImage : "/stardust-hero.png";
    const content = Array.isArray(body.content) ? body.content.map((item: unknown) => text(item, 3000)).filter(Boolean).slice(0, 30) : [];

    if (title.length < 5 || !category || summary.length < 10 || !date || !readTime || !content.length) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    let createdPost: Post | undefined;
    let writeError: unknown;
    writeQueue = writeQueue.then(async () => {
      try {
        const posts = await getPosts();
        const baseSlug = slugify(title) || `reflexion-${Date.now()}`;
        let slug = baseSlug;
        let suffix = 2;
        while (posts.some(post => post.slug === slug)) slug = `${baseSlug}-${suffix++}`;
        createdPost = { slug, title, image, date, category, summary, readTime, content };
        posts.unshift(createdPost);
        await writeFile(postsPath, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
      } catch (error) {
        writeError = error;
      }
    });
    await writeQueue;
    if (writeError || !createdPost) throw writeError;
    return NextResponse.json(createdPost, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la reflexión." }, { status: 500 });
  }
}
