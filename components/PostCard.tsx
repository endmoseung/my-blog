import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

const tagChip = (t: string) => (
  <span
    key={t}
    style={{
      fontSize: ".72rem",
      fontWeight: 700,
      color: "var(--accent)",
      background: "color-mix(in srgb, var(--accent) 14%, transparent)",
      padding: "2px 9px",
      borderRadius: 999,
    }}
  >
    #{t}
  </span>
);

export default function PostCard({ post, large = false }: { post: PostMeta; large?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="post-card"
      style={{
        display: "block",
        padding: large ? 28 : 20,
        borderRadius: 18,
        background: large
          ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card))"
          : "var(--card)",
        border: "1px solid var(--line)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        gridColumn: large ? "1 / -1" : undefined,
      }}
    >
      <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 10 }}>
        {large && (
          <span
            style={{
              fontSize: ".7rem",
              fontWeight: 800,
              color: "#fff",
              background: "var(--accent)",
              padding: "2px 10px",
              borderRadius: 999,
            }}
          >
            ✦ FEATURED
          </span>
        )}
        {post.tags.map(tagChip)}
      </div>
      <h3
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
        }}
      >
        {post.excerpt}
      </p>
      <time style={{ color: "var(--muted)", fontSize: ".78rem", display: "block", marginTop: 12 }}>
        {post.date}
      </time>
    </Link>
  );
}
