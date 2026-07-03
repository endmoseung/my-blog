import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, postUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  // /blog 인덱스는 홈으로 308 통합됨 — sitemap에서 제외
  const staticPages = ["", "/about", "/search"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1.0 : 0.8,
  }));
  const postPages = posts
    .filter((p) => !p.noindex)
    .map((p) => ({
      url: postUrl(p.slug),
      lastModified: new Date(p.updatedDate ?? p.date),
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.75 : 0.6,
    }));
  return [...staticPages, ...postPages];
}
