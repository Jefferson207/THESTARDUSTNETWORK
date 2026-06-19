import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Post } from "@/lib/types";

export const postsPath = path.join(process.cwd(), "data", "posts.json");

export async function getPosts(): Promise<Post[]> {
  const content = await readFile(postsPath, "utf8");
  return JSON.parse(content) as Post[];
}
