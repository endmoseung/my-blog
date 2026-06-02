import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const staticPages = ["", "/blog", "/about", "/search"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
  }));
  const postPages = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));
  return [...staticPages, ...postPages];
}
