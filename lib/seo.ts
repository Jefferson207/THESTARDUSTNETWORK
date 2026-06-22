import type { Post } from "@/lib/types";

export const siteConfig = {
  name: "The Stardust Network",
  shortName: "Stardust Network",
  url: "https://thestardustnetwork.org",
  locale: "es_PE",
  language: "es-PE",
  title: "The Stardust Network | Comunidad de crecimiento consciente",
  description: "Comunidad de crecimiento consciente, empatía y acción. Explora reflexiones sobre amor, respeto, solidaridad, libertad y nuestro origen cósmico.",
  socialImage: "/stardust-hero.png",
} as const;

export const rssAlternates = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${siteConfig.name} - Reflexiones` }],
};

export function absoluteUrl(pathname = "/") {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  return new URL(pathname, siteConfig.url).toString();
}

const months: Record<string, string> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

export function postPublishedDate(post: Post) {
  if (post.publishedAt && /^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt)) return post.publishedAt;
  const [day, rawMonth, year] = post.date.trim().toLowerCase().split(/\s+/);
  const month = months[rawMonth?.slice(0, 3)];
  if (!day || !month || !/^\d{4}$/.test(year)) return undefined;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}
