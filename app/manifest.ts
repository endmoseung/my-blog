import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESC } from "@/lib/site";

// 'any'와 'maskable'은 분리한다 — 합친 'any maskable'은 패딩 때문에 일반 아이콘이 작게 보여 권장하지 않음.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESC,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#020817",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
