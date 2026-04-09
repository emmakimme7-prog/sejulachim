import type { MetadataRoute } from "next";
import { listPublicContentItems } from "@/lib/content/public-content";

const BASE_URL = process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/library`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const articles = await listPublicContentItems(500);
    const articleRoutes: MetadataRoute.Sitemap = articles.map((item) => ({
      url: `${BASE_URL}/archive/${item.slug}`,
      lastModified: item.published_at ? new Date(item.published_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
