import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/admin"]
    },
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap-news`],
    host: baseUrl
  };
}
