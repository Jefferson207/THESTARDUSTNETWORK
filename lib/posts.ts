import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Post } from "@/lib/types";

export const postsPath = path.join(process.cwd(), "data", "posts.json");

export async function getPosts(): Promise<Post[]> {
  const content = await readFile(postsPath, "utf8");
  const seedPosts = JSON.parse(content) as Post[];
  const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return seedPosts;

  try {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["LRANGE", "stardust:posts", 0, -1]),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`POST_STORAGE_${response.status}`);
    const payload = await response.json() as { result?: string[]; error?: string };
    if (payload.error) throw new Error(payload.error);
    const storedPosts = (payload.result ?? []).flatMap(value => {
      try { return [JSON.parse(value) as Post]; } catch { return []; }
    });
    const deletedResponse = await fetch(redisUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["SMEMBERS", "stardust:deleted-posts"]),
      cache: "no-store",
    });
    if (!deletedResponse.ok) throw new Error(`POST_STORAGE_${deletedResponse.status}`);
    const deletedPayload = await deletedResponse.json() as { result?: string[]; error?: string };
    if (deletedPayload.error) throw new Error(deletedPayload.error);
    const deletedSlugs = new Set(deletedPayload.result ?? []);
    return [...storedPosts, ...seedPosts].filter(post => !deletedSlugs.has(post.slug));
  } catch (error) {
    console.error("Could not load stored posts", error);
    return seedPosts;
  }
}
