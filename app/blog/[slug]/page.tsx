import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
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

  return (
    <article>
      <ReadingProgress />
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {post.title}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 12 }}>
          {post.date} · {minRead} min read
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
      <Comments postSlug={slug} />
    </article>
  );
}
