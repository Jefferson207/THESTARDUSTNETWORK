import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Constellation } from "@/lib/types";

export const constellationsPath = path.join(process.cwd(), "data", "constellations.json");

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const constellationsKey = "stardust:constellations";
let writeQueue = Promise.resolve();

function storageHeaders() {
  return { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" };
}

async function redisCommand(command: unknown[]) {
  if (!redisUrl || !redisToken) throw new Error("CONSTELLATION_STORAGE_NOT_CONFIGURED");
  const response = await fetch(redisUrl, { method: "POST", headers: storageHeaders(), body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error(`CONSTELLATION_STORAGE_${response.status}`);
  const payload = await response.json() as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

export async function getSeedConstellations(): Promise<Constellation[]> {
  const content = await readFile(constellationsPath, "utf8");
  return JSON.parse(content) as Constellation[];
}

export async function getConstellations(): Promise<Constellation[]> {
  const seedConstellations = await getSeedConstellations();
  if (!redisUrl || !redisToken) return seedConstellations;

  try {
    const stored = await redisCommand(["GET", constellationsKey]);
    if (typeof stored !== "string") return seedConstellations;
    const parsed = JSON.parse(stored) as Constellation[];
    return Array.isArray(parsed) ? parsed : seedConstellations;
  } catch (error) {
    console.error("Could not load stored constellations", error);
    return seedConstellations;
  }
}

export async function saveConstellations(constellations: Constellation[]) {
  if (redisUrl && redisToken) {
    await redisCommand(["SET", constellationsKey, JSON.stringify(constellations)]);
    return;
  }
  if (process.env.VERCEL) throw new Error("CONSTELLATION_STORAGE_NOT_CONFIGURED");

  let writeError: unknown;
  writeQueue = writeQueue.then(async () => {
    try {
      await writeFile(constellationsPath, `${JSON.stringify(constellations, null, 2)}\n`, "utf8");
    } catch (error) {
      writeError = error;
    }
  });
  await writeQueue;
  if (writeError) throw writeError;
}
