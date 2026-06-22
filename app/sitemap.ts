import type { MetadataRoute } from "next";
import constellationsData from "@/data/constellations.json";
import { getPosts } from "@/lib/posts";
import { absoluteUrl, postPublishedDate } from "@/lib/seo";
import type { Constellation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  const constellations = constellationsData as Constellation[];

  return [
    { url: absoluteUrl(), changeFrequency: "weekly", priority: 1 },
    ...constellations.map(item => ({
      url: absoluteUrl(`/constelaciones/${item.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map(post => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: postPublishedDate(post),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
