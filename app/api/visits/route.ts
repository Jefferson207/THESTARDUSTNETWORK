import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const visitsPath = path.join(process.cwd(), "data", "visits.json");
const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redisKey = "stardust:visits";
let writeQueue = Promise.resolve();

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  if (!redisUrl || !redisToken) throw new Error("VISIT_STORAGE_NOT_CONFIGURED");
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`VISIT_STORAGE_${response.status}`);
  const payload = await response.json() as { result?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result as T;
}

async function readLocalCount() {
  const content = JSON.parse(await readFile(visitsPath, "utf8")) as { count?: unknown };
  return typeof content.count === "number" && Number.isFinite(content.count) ? content.count : 0;
}

function json(count: number, status = 200) {
  return NextResponse.json(
    { count },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function GET() {
  try {
    if (redisUrl && redisToken) {
      const stored = await redisCommand<string | null>(["GET", redisKey]);
      return json(Number(stored ?? 0));
    }
    return json(await readLocalCount());
  } catch (error) {
    console.error("Could not load visit count", error);
    return NextResponse.json({ error: "No se pudo cargar el contador." }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (redisUrl && redisToken) {
      return json(await redisCommand<number>(["INCR", redisKey]));
    }
    if (process.env.VERCEL) {
      return NextResponse.json({ error: "El contador no está configurado." }, { status: 503 });
    }

    let count = 0;
    let writeError: unknown;
    writeQueue = writeQueue.then(async () => {
      try {
        count = (await readLocalCount()) + 1;
        await writeFile(visitsPath, `${JSON.stringify({ count }, null, 2)}\n`, "utf8");
      } catch (error) {
        writeError = error;
      }
    });
    await writeQueue;
    if (writeError) throw writeError;
    return json(count);
  } catch (error) {
    console.error("Could not increment visit count", error);
    return NextResponse.json({ error: "No se pudo actualizar el contador." }, { status: 500 });
  }
}
