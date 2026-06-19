import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const commentsPath = path.join(process.cwd(), "data", "comments.json");
let writeQueue = Promise.resolve();

async function readComments(): Promise<Comment[]> {
  const content = await readFile(commentsPath, "utf8");
  return JSON.parse(content) as Comment[];
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: NextRequest) {
  const postSlug = clean(request.nextUrl.searchParams.get("postSlug"), 120);
  if (!postSlug) return NextResponse.json({ error: "Falta el artículo." }, { status: 400 });

  try {
    const comments = await readComments();
    return NextResponse.json(comments.filter(comment => comment.postSlug === postSlug));
  } catch {
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

    let writeError: unknown;
    writeQueue = writeQueue.then(async () => {
      try {
        const comments = await readComments();
        comments.push(comment);
        await writeFile(commentsPath, `${JSON.stringify(comments, null, 2)}\n`, "utf8");
      } catch (error) {
        writeError = error;
      }
    });
    await writeQueue;
    if (writeError) throw writeError;

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el comentario." }, { status: 500 });
  }
}
