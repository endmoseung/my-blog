import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import ReadingProgress from "@/components/ReadingProgress";
import Comments from "@/components/Comments";
import FadeIn from "@/components/FadeIn";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return { title: `${post.title} — 내 블로그`, description: post.excerpt };
  } catch {
    return { title: "내 블로그" };
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }
  const words = post.content.trim().split(/\s+/).length;
  const minRead = Math.max(1, Math.round(words / 200));

  // 이전/다음 글 (목록은 최신순) — prev=더 최신, next=더 과거
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <article style={{ maxWidth: 680, margin: "0 auto" }}>
      <ReadingProgress />
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {post.title}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 12 }}>
          <time dateTime={post.date}>{post.date}</time> · {minRead} min read
        </p>
        <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: 12 }}>
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
      </header>
      <FadeIn>
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
            },
          }}
        />
      </FadeIn>

      {/* 이전·다음 글 내비 */}
      <nav
        style={{
          display: "flex",
          gap: 12,
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
        }}
      >
        {prev ? (
          <Link href={`/blog/${prev.slug}`} style={{ flex: 1, textDecoration: "none", color: "var(--fg)" }}>
            <span style={{ color: "var(--muted)", fontSize: ".75rem", display: "block" }}>← 이전 글</span>
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{prev.title}</span>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <Link href={`/blog/${next.slug}`} style={{ flex: 1, textAlign: "right", textDecoration: "none", color: "var(--fg)" }}>
            <span style={{ color: "var(--muted)", fontSize: ".75rem", display: "block" }}>다음 글 →</span>
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{next.title}</span>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </nav>
      <p style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/blog" style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 600 }}>
          ← 글 목록으로
        </Link>
      </p>

      <Comments postSlug={slug} />
    </article>
  );
}
