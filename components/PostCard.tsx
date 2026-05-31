import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="post-card"
      style={{
        display: "block",
        padding: 20,
        borderRadius: 18,
        background: "var(--card)",
        border: "1px solid var(--line)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
        {post.tags.map((t) => (
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
        ))}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: "1.12rem", letterSpacing: "-0.01em" }}>{post.title}</h3>
      <p style={{ color: "var(--muted)", fontSize: ".92rem", marginTop: 6, lineHeight: 1.55 }}>{post.excerpt}</p>
      <time style={{ color: "var(--muted)", fontSize: ".78rem", display: "block", marginTop: 10 }}>{post.date}</time>
    </Link>
  );
}
