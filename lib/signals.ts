import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Signal } from "@/lib/types";

export const signalsPath = path.join(process.cwd(), "data", "signals.json");

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const signalsKey = "stardust:signals";
let writeQueue = Promise.resolve();

function storageHeaders() {
  return { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" };
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  if (!redisUrl || !redisToken) throw new Error("SIGNAL_STORAGE_NOT_CONFIGURED");
  const response = await fetch(redisUrl, { method: "POST", headers: storageHeaders(), body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error(`SIGNAL_STORAGE_${response.status}`);
  const payload = await response.json() as { result?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result as T;
}

async function readLocalSignals(): Promise<Signal[]> {
  const content = await readFile(signalsPath, "utf8");
  return JSON.parse(content) as Signal[];
}

export async function getSignals(): Promise<Signal[]> {
  if (redisUrl && redisToken) {
    const stored = await redisCommand<string[]>(["LRANGE", signalsKey, 0, -1]);
    return (stored ?? []).flatMap(value => {
      try { return [JSON.parse(value) as Signal]; } catch { return []; }
    });
  }
  return readLocalSignals();
}

export async function storeSignal(signal: Signal) {
  if (redisUrl && redisToken) {
    await redisCommand<number>(["LPUSH", signalsKey, JSON.stringify(signal)]);
    return;
  }
  if (process.env.VERCEL) throw new Error("SIGNAL_STORAGE_NOT_CONFIGURED");

  let writeError: unknown;
  writeQueue = writeQueue.then(async () => {
    try {
      const signals = await readLocalSignals();
      signals.unshift(signal);
      await writeFile(signalsPath, `${JSON.stringify(signals, null, 2)}\n`, "utf8");
    } catch (error) {
      writeError = error;
    }
  });
  await writeQueue;
  if (writeError) throw writeError;
}
