import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";
import { getConstellations } from "@/lib/constellations";
import { absoluteUrl, postPublishedDate } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, constellations] = await Promise.all([getPosts(), getConstellations()]);

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
