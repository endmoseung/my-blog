import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME, SITE_DESC } from "@/lib/site";

// 사이트 기본 OG 이미지 — 포스트별 이미지가 없는 라우트(홈·about·검색 등)의 공유 썸네일.
// 이 파일의 export(alt/size/contentType)에서 Next가 og:image / twitter:image 메타를 자동 생성한다.
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Satori는 woff2를 못 읽는다(브로틀리 미지원) → static woff를 쓴다.
  // process.cwd()는 프로젝트 루트.
  const bold = await readFile(join(process.cwd(), "app/fonts/Pretendard-Bold.woff"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
          padding: 96,
          background: "#020817",
          color: "#f8fafc",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#94a3b8" }}>{SITE_DESC}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: bold, weight: 700, style: "normal" }],
    },
  );
}
