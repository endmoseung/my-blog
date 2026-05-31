"use client";
import { useState } from "react";
import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

export default function TagFilter({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? posts.filter((p) => p.tags.includes(active)) : posts;

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
        color: on ? "#fff" : "var(--fg)",
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
        {tags.map((t) => chip(`#${t}`, active === t, () => setActive(t)))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {shown.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </>
  );
}
