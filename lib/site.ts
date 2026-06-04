// 배포 도메인 — 환경변수 SITE_URL로 주입(미설정 시 localhost). 끝 슬래시 제거.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "내 블로그";
export const SITE_DESC = "심플하고 읽기 좋은 개인 블로그";

// 작성자 — JSON-LD author·OG article:author·about Person 스키마가 공유.
export const SITE_AUTHOR = "모승";
export const SITE_AUTHOR_GITHUB = "https://github.com/endmoseung";

// 글 절대 URL — slug에 한글·점이 섞여 있어 그대로 쓰면 sitemap/RSS의 <loc>가
// RFC 3986 위반(raw 한글)이 되고, page.tsx canonical(자동 인코딩)과도 어긋난다.
// 모든 글 URL을 이 헬퍼로 통일해 인코딩 형태를 한 곳에서 보장한다.
export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${encodeURIComponent(slug)}`;
}
