import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 프로덕션이 아닌 배포(프리뷰·스테이징)는 색인에서 통째로 막아 중복/유출을 방지.
// /api는 disallow하지 않는다 — 크롤 콘텐츠가 아니고 막으면 렌더에 해가 된다.
// Naver(Yeti)·Daum은 와일드카드 allow로 이미 커버됨.
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;

  if (!isProd) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
