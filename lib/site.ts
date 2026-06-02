// 배포 도메인 — 환경변수 SITE_URL로 주입(미설정 시 localhost). 끝 슬래시 제거.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "내 블로그";
export const SITE_DESC = "심플하고 읽기 좋은 개인 블로그";

// 작성자 — JSON-LD author·OG article:author·about Person 스키마가 공유.
export const SITE_AUTHOR = "모승";
export const SITE_AUTHOR_GITHUB = "https://github.com/endmoseung";
