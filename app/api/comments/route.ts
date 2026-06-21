import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const commentsPath = path.join(process.cwd(), "data", "comments.json");
const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redisKey = "stardust:comments";
let writeQueue = Promise.resolve();

async function readSeedComments(): Promise<Comment[]> {
  const content = await readFile(commentsPath, "utf8");
  return JSON.parse(content) as Comment[];
}

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  if (!redisUrl || !redisToken) throw new Error("COMMENT_STORAGE_NOT_CONFIGURED");
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`COMMENT_STORAGE_${response.status}`);
  const payload = await response.json() as { result?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result as T;
}

async function readStoredComments(): Promise<Comment[]> {
  if (!redisUrl || !redisToken) return [];
  const stored = await redisCommand<string[]>(["LRANGE", redisKey, 0, -1]);
  return (stored ?? []).flatMap(value => {
    try { return [JSON.parse(value) as Comment]; } catch { return []; }
  });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: NextRequest) {
  const postSlug = clean(request.nextUrl.searchParams.get("postSlug"), 120);
  if (!postSlug) return NextResponse.json({ error: "Falta el espacio de conversación." }, { status: 400 });

  try {
    const [seed, stored] = await Promise.all([readSeedComments(), readStoredComments()]);
    return NextResponse.json([...seed, ...stored].filter(comment => comment.postSlug === postSlug));
  } catch (error) {
    console.error("Could not load comments", error);
    return NextResponse.json({ error: "No se pudieron cargar los comentarios." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postSlug = clean(body.postSlug, 120);
    const name = clean(body.name, 60);
    const message = clean(body.message, 800);

    if (!postSlug || name.length < 2 || message.length < 3) {
      return NextResponse.json({ error: "Completa correctamente tu nombre y comentario." }, { status: 400 });
    }

    const comment: Comment = {
      postSlug,
      name,
      message,
      date: new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
    };

    if (redisUrl && redisToken) {
      await redisCommand<number>(["RPUSH", redisKey, JSON.stringify(comment)]);
    } else if (!process.env.VERCEL) {
      let writeError: unknown;
      writeQueue = writeQueue.then(async () => {
        try {
          const comments = await readSeedComments();
          comments.push(comment);
          await writeFile(commentsPath, `${JSON.stringify(comments, null, 2)}\n`, "utf8");
        } catch (error) { writeError = error; }
      });
      await writeQueue;
      if (writeError) throw writeError;
    } else {
      return NextResponse.json({ error: "El almacenamiento de comentarios no está configurado." }, { status: 503 });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Could not save comment", error);
    return NextResponse.json({ error: "No se pudo guardar el comentario." }, { status: 500 });
  }
}
