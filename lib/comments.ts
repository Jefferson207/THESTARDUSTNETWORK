import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Comment } from "@/lib/types";

const commentsPath = path.join(process.cwd(), "data", "comments.json");

export async function getComments(): Promise<Comment[]> {
  const seed = JSON.parse(await readFile(commentsPath, "utf8")) as Comment[];
  const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return seed;
  try {
    const response = await fetch(redisUrl, { method: "POST", headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" }, body: JSON.stringify(["LRANGE", "stardust:comments", 0, -1]), cache: "no-store" });
    if (!response.ok) throw new Error(`COMMENT_STORAGE_${response.status}`);
    const payload = await response.json() as { result?: string[]; error?: string };
    if (payload.error) throw new Error(payload.error);
    const stored = (payload.result ?? []).flatMap(value => { try { return [JSON.parse(value) as Comment]; } catch { return []; } });
    return [...seed, ...stored];
  } catch (error) {
    console.error("Could not load comment counts", error);
    return seed;
  }
}
