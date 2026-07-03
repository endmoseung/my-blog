// 배포 도메인 — 환경변수로 주입. Vercel 기본 env까지 흡수해 localhost 메타가 프로덕션에 새지 않게 한다.
function normalizeSiteUrl(url: string): string {
  const withProtocol = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000",
);
export const SITE_NAME = "모승 블로그";
export const SITE_DESC = "프론트엔드 개발자 김승모가 개발, 회고, 사이드 프로젝트, 커뮤니티 경험을 기록하는 개인 블로그";
export const SITE_KEYWORDS = [
  "김승모",
  "모승",
  "프론트엔드",
  "프론트엔드 개발자",
  "개발 블로그",
  "회고",
  "사이드 프로젝트",
  "React",
  "Next.js",
  "JavaScript",
  "TypeScript",
];

// 작성자 — JSON-LD author·OG article:author·about Person 스키마가 공유.
export const SITE_AUTHOR = "김승모";
export const SITE_AUTHOR_GITHUB = "https://github.com/endmoseung";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// 글 절대 URL — slug에 한글·점이 섞여 있어 그대로 쓰면 sitemap/RSS의 <loc>가
// RFC 3986 위반(raw 한글)이 되고, page.tsx canonical(자동 인코딩)과도 어긋난다.
// 모든 글 URL을 이 헬퍼로 통일해 인코딩 형태를 한 곳에서 보장한다.
export function postPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function postUrl(slug: string): string {
  return absoluteUrl(postPath(slug));
}

export function postOgImageUrl(slug: string): string {
  return `${postUrl(slug)}/opengraph-image`;
}
