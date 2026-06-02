import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site";

export const alt = "블로그 글";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 빌드타임 정적 생성 — 포스트별 OG를 빌드 시 1회 렌더. Satori가 실제 쓰인 글자만 자동 서브셋하므로
// 풀 woff를 넘겨도 최종 PNG는 가볍고, 런타임 비용이 0이다.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  // v16: params는 Promise라 await 필수.
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // Satori는 woff2 ✗ → static woff. 제목은 Bold, 본문(excerpt)은 Regular.
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "app/fonts/Pretendard-Bold.woff")),
    readFile(join(process.cwd(), "app/fonts/Pretendard-Regular.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 96,
          background: "#020817",
          color: "#f8fafc",
          fontFamily: "Pretendard",
        }}
      >
        {/* 상단: 사이트명 라벨 */}
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#94a3b8" }}>
          {SITE_NAME}
        </div>

        {/* 가운데: 제목 + excerpt */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {post.title}
          </div>
          {post.excerpt ? (
            <div style={{ display: "flex", fontSize: 34, color: "#94a3b8", lineHeight: 1.4 }}>
              {post.excerpt}
            </div>
          ) : null}
        </div>

        {/* 하단: 태그 + 날짜 */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#64748b" }}>
          <div style={{ display: "flex" }}>{post.tags.map((t) => `#${t}`).join("  ")}</div>
          <div style={{ display: "flex" }}>{post.date}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
