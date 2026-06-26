import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { getPosts, postsPath } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { getConstellations } from "@/lib/constellations";
import { adminAuthConfigured, validAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const postsKey = "stardust:posts";
let writeQueue = Promise.resolve();

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeContentBlock(value: unknown) {
  const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "blockquote", "h2", "h3"]);
  return text(value, 6000)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(p|h2|h3|blockquote|li)([^>]*)\sstyle=(["'])(.*?)\3([^>]*)>/gi, (_match, tag: string, _before: string, _quote: string, style: string) => {
      const align = style.match(/text-align\s*:\s*(center|right|justify)/i)?.[1].toLowerCase();
      return align ? `<${tag.toLowerCase()} data-align="${align}">` : `<${tag.toLowerCase()}>`;
    })
    .replace(/<(p|h2|h3|blockquote|li)([^>]*)\salign=(["']?)(center|right|justify)\3([^>]*)>/gi, (_match, tag: string, _before: string, _quote: string, align: string) => {
      return `<${tag.toLowerCase()} data-align="${align.toLowerCase()}">`;
    })
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:style|class|id|src|href|target|rel)=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<\/?([a-z0-9-]+)(?:\s[^>]*)?>/gi, (match, tag: string) => {
      const safeTag = tag.toLowerCase();
      if (!allowedTags.has(safeTag)) return "";
      if (safeTag === "br") return "<br>";
      const align = match.match(/\sdata-align=["'](center|right|justify)["']/i)?.[1].toLowerCase();
      if (align && ["p", "h2", "h3", "blockquote", "li"].includes(safeTag) && !match.startsWith("</")) return `<${safeTag} data-align="${align}">`;
      return match.startsWith("</") ? `</${safeTag}>` : `<${safeTag}>`;
    })
    .trim();
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function validRequestCredentials(request: NextRequest) {
  return validAdminCredentials(request.headers.get("x-admin-username") || "", request.headers.get("x-admin-password") || "");
}

function storageHeaders() {
  return { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" };
}

async function redisCommand(command: unknown[]) {
  if (!redisUrl || !redisToken) throw new Error("POST_STORAGE_NOT_CONFIGURED");
  const response = await fetch(redisUrl, { method: "POST", headers: storageHeaders(), body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error(`POST_STORAGE_${response.status}`);
  const payload = await response.json() as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

async function storePost(post: Post) {
  if (redisUrl && redisToken) {
    await redisCommand(["LPUSH", postsKey, JSON.stringify(post)]);
    return;
  }
  if (process.env.VERCEL) throw new Error("POST_STORAGE_NOT_CONFIGURED");

  let writeError: unknown;
  writeQueue = writeQueue.then(async () => {
    try {
      const posts = await getPosts();
      posts.unshift(post);
      await writeFile(postsPath, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
    } catch (error) {
      writeError = error;
    }
  });
  await writeQueue;
  if (writeError) throw writeError;
}

async function updatePost(slug: string, post: Post) {
  if (redisUrl && redisToken) {
    const stored = await redisCommand(["LRANGE", postsKey, 0, -1]) as string[];
    let replaced = false;
    const updated = stored.map(value => {
      try {
        const current = JSON.parse(value) as Post;
        if (current.slug !== slug) return value;
        replaced = true;
        return JSON.stringify(post);
      } catch {
        return value;
      }
    });
    if (!replaced) updated.unshift(JSON.stringify(post));
    await redisCommand(["DEL", postsKey]);
    if (updated.length) await redisCommand(["RPUSH", postsKey, ...updated]);
    return true;
  }
  if (process.env.VERCEL) throw new Error("POST_STORAGE_NOT_CONFIGURED");

  let updated = false;
  let writeError: unknown;
  writeQueue = writeQueue.then(async () => {
    try {
      const posts = await getPosts();
      const nextPosts = posts.map(current => {
        if (current.slug !== slug) return current;
        updated = true;
        return post;
      });
      if (updated) await writeFile(postsPath, `${JSON.stringify(nextPosts, null, 2)}\n`, "utf8");
    } catch (error) {
      writeError = error;
    }
  });
  await writeQueue;
  if (writeError) throw writeError;
  return updated;
}

async function removePost(slug: string) {
  if (redisUrl && redisToken) {
    const stored = await redisCommand(["LRANGE", postsKey, 0, -1]) as string[];
    const visiblePosts = await getPosts();
    const kept = stored.filter(value => {
      try {
        return (JSON.parse(value) as Post).slug !== slug;
      } catch {
        return true;
      }
    });
    if (kept.length === stored.length && !visiblePosts.some(post => post.slug === slug)) return false;

    if (kept.length !== stored.length) {
      await redisCommand(["DEL", postsKey]);
      if (kept.length) await redisCommand(["RPUSH", postsKey, ...kept]);
    }
    await redisCommand(["SADD", "stardust:deleted-posts", slug]);
    return true;
  }
  if (process.env.VERCEL) throw new Error("POST_STORAGE_NOT_CONFIGURED");

  let deleted = false;
  let writeError: unknown;
  writeQueue = writeQueue.then(async () => {
    try {
      const posts = await getPosts();
      const kept = posts.filter(post => post.slug !== slug);
      deleted = kept.length !== posts.length;
      if (deleted) await writeFile(postsPath, `${JSON.stringify(kept, null, 2)}\n`, "utf8");
    } catch (error) {
      writeError = error;
    }
  });
  await writeQueue;
  if (writeError) throw writeError;
  return deleted;
}

export async function GET(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });

  try {
    const posts = await getPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Could not load posts", error);
    return NextResponse.json({ error: "No se pudieron cargar los articulos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });

  try {
    const body = await request.json();
    const title = text(body.title, 140);
    const constellationSlug = text(body.constellation, 100);
    const constellations = await getConstellations();
    const selected = constellations.find(item => item.slug === constellationSlug);
    const summary = text(body.summary, 300);
    const date = text(body.date, 40);
    const publishedAt = text(body.publishedAt, 10);
    const readTime = text(body.readTime, 20);
    const requestedImage = text(body.image, 1000);
    const image = requestedImage.startsWith("/") || requestedImage.startsWith("https://") ? requestedImage : "/stardust-hero.png";
    const content = Array.isArray(body.content) ? body.content.map(sanitizeContentBlock).filter(Boolean).slice(0, 30) : [];

    if (title.length < 5 || !selected || summary.length < 10 || !date || !readTime || !content.length) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    const posts = await getPosts();
    const baseSlug = slugify(title) || `articulo-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 2;
    while (posts.some(post => post.slug === slug)) slug = `${baseSlug}-${suffix++}`;

    const post: Post = {
      slug,
      constellation: selected.slug,
      title,
      image,
      date,
      publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ? publishedAt : undefined,
      category: selected.title,
      summary,
      readTime,
      content,
    };
    await storePost(post);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Could not save post", error);
    const missing = error instanceof Error && error.message === "POST_STORAGE_NOT_CONFIGURED";
    return NextResponse.json({ error: missing ? "El almacenamiento de articulos no esta configurado." : "No se pudo guardar el articulo." }, { status: missing ? 503 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });

  try {
    const body = await request.json();
    const slug = text(body.slug, 100);
    const title = text(body.title, 140);
    const constellationSlug = text(body.constellation, 100);
    const constellations = await getConstellations();
    const selected = constellations.find(item => item.slug === constellationSlug);
    const summary = text(body.summary, 300);
    const date = text(body.date, 40);
    const publishedAt = text(body.publishedAt, 10);
    const readTime = text(body.readTime, 20);
    const requestedImage = text(body.image, 1000);
    const image = requestedImage.startsWith("/") || requestedImage.startsWith("https://") ? requestedImage : "/stardust-hero.png";
    const content = Array.isArray(body.content) ? body.content.map(sanitizeContentBlock).filter(Boolean).slice(0, 30) : [];

    if (!slug) return NextResponse.json({ error: "Indica el articulo que deseas editar." }, { status: 400 });
    if (title.length < 5 || !selected || summary.length < 10 || !date || !readTime || !content.length) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    const posts = await getPosts();
    const current = posts.find(post => post.slug === slug);
    if (!current) return NextResponse.json({ error: "No se encontro el articulo." }, { status: 404 });

    const post: Post = {
      slug: current.slug,
      constellation: selected.slug,
      title,
      image,
      date,
      publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ? publishedAt : undefined,
      category: selected.title,
      summary,
      readTime,
      content,
    };
    const updated = await updatePost(slug, post);
    if (!updated) return NextResponse.json({ error: "No se encontro el articulo." }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Could not update post", error);
    const missing = error instanceof Error && error.message === "POST_STORAGE_NOT_CONFIGURED";
    return NextResponse.json({ error: missing ? "El almacenamiento de articulos no esta configurado." : "No se pudo actualizar el articulo." }, { status: missing ? 503 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const slug = text(body.slug, 100);
    if (!slug) return NextResponse.json({ error: "Indica el articulo que deseas eliminar." }, { status: 400 });

    const deleted = await removePost(slug);
    if (!deleted) return NextResponse.json({ error: "No se encontro el articulo." }, { status: 404 });
    return NextResponse.json({ deleted: true, slug });
  } catch (error) {
    console.error("Could not delete post", error);
    const missing = error instanceof Error && error.message === "POST_STORAGE_NOT_CONFIGURED";
    return NextResponse.json({ error: missing ? "El almacenamiento de articulos no esta configurado." : "No se pudo eliminar el articulo." }, { status: missing ? 503 : 500 });
  }
}
