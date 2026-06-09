import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { postPath } from "@/lib/site";

// 일반 카드는 태그를 한 줄로 고정 — 앞 N개만 칩으로, 나머지는 "+N"으로 접어 제목 시작선을 카드마다 맞춘다.
const MAX_CHIPS = 3;

const tagChip = (t: string) => (
  <span
    key={t}
    style={{
      fontSize: ".72rem",
      fontWeight: 600,
      color: "var(--muted)",
      background: "var(--chip)",
      padding: "3px 10px",
      borderRadius: 999,
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >
    #{t}
  </span>
);

export default function PostCard({ post, large = false }: { post: PostMeta; large?: boolean }) {
  return (
    <Link
      href={postPath(post.slug)}
      className={`post-card ${large ? "post-card--large" : "post-card--default"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: large ? 28 : 20,
        borderRadius: 18,
        background: "var(--card)",
        border: "1px solid var(--line)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        gridColumn: large ? "1 / -1" : undefined,
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{
          marginBottom: 10,
          // large(전체폭)는 wrap 허용, 일반 카드는 한 줄 고정 + 넘치면 잘라 제목 시작 위치를 카드마다 일치시킴
          flexWrap: large ? "wrap" : "nowrap",
          overflow: large ? undefined : "hidden",
        }}
      >
        {large && (
          <span
            style={{
              fontSize: ".7rem",
              fontWeight: 800,
              color: "var(--bg)",
              background: "var(--fg)",
              padding: "2px 10px",
              borderRadius: 999,
            }}
          >
            ✦ FEATURED
          </span>
        )}
        {(large ? post.tags : post.tags.slice(0, MAX_CHIPS)).map(tagChip)}
        {!large && post.tags.length > MAX_CHIPS && (
          <span
            style={{
              fontSize: ".72rem",
              fontWeight: 600,
              color: "var(--muted)",
              background: "var(--chip)",
              padding: "3px 10px",
              borderRadius: 999,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            +{post.tags.length - MAX_CHIPS}
          </span>
        )}
      </div>
      <h3
        className="post-card-title"
        style={{
          fontWeight: 800,
          fontSize: large ? "1.6rem" : "1.12rem",
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
        }}
      >
        {post.title}
      </h3>
      <p
        style={{
          color: "var(--muted)",
          fontSize: large ? "1rem" : ".92rem",
          marginTop: 8,
          lineHeight: 1.6,
          // excerpt를 2줄로 제한해 카드 간 높이 편차를 줄인다(large는 제한 없음).
          ...(large
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }),
        }}
      >
        {post.excerpt}
      </p>
      {/* 날짜를 카드 맨 아래로 고정 — 카드 높이가 같아지면 날짜선이 가지런해진다. */}
      <time dateTime={post.date} style={{ color: "var(--muted)", fontSize: ".78rem", display: "block", marginTop: "auto", paddingTop: 12 }}>
        {post.date}
      </time>
    </Link>
  );
}
