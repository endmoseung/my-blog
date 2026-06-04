"use client";
import { useState } from "react";
import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

type TagCount = { tag: string; count: number };

// 2회 이상 쓰인 태그만 기본 노출 — 1회용 롱테일은 "더보기"로 접는다.
const MIN_COUNT = 2;

export default function TagFilter({ posts, tags }: { posts: PostMeta[]; tags: TagCount[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const shown = active ? posts.filter((p) => p.tags.includes(active)) : posts;

  const primary = tags.filter((t) => t.count >= MIN_COUNT);
  const rest = tags.filter((t) => t.count < MIN_COUNT);
  // 접힌 상태면 자주 쓰인 태그만, 단 현재 선택된 태그가 rest에 있으면 항상 보이게 포함.
  const visible = expanded ? tags : primary.concat(rest.filter((t) => t.tag === active));

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      aria-pressed={on}
      style={{
        padding: "5px 14px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: on ? "var(--accent)" : "transparent",
        color: on ? "var(--bg)" : "var(--fg)",
        fontWeight: 700,
        fontSize: ".85rem",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 24 }}>
        {chip("전체", !active, () => setActive(null))}
        {visible.map((t) => chip(`#${t.tag} ${t.count}`, active === t.tag, () => setActive(t.tag)))}
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              border: "1px dashed var(--line)",
              background: "transparent",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: ".85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {expanded ? "접기" : `+${rest.length}개 더보기`}
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: ".95rem", padding: "20px 0" }}>
          {active ? `“#${active}” 태그에 해당하는 글이 아직 없어요.` : "아직 글이 없어요. 곧 채울게요!"}
        </p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))" }}>
          {shown.map((p) => (
            <PostCard key={p.slug} post={p} large={!active && p.featured} />
          ))}
        </div>
      )}
    </>
  );
}
