import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { jsonLdHtml } from "@/lib/json-ld";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESC,
  SITE_AUTHOR,
  SITE_AUTHOR_GITHUB,
  postOgImageUrl,
  postPath,
  postUrl as makePostUrl,
} from "@/lib/site";
import PostCard from "@/components/PostCard";
import ReadingProgress from "@/components/ReadingProgress";
import Comments from "@/components/Comments";
import FadeIn from "@/components/FadeIn";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

// Next 16은 동적 라우트의 params.slug를 자동 디코딩하지 않는다.
// 한글·점 등이 든 slug은 "%EC%A0%80..." 처럼 인코딩된 채 도착하므로
// 파일명(저는-개발자입니다.mdx)과 매칭하려면 직접 디코딩해야 한다.
// 잘못된 퍼센트 시퀀스는 decodeURIComponent가 throw → 원본을 그대로 쓴다.
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  try {
    const post = getPostBySlug(slug);
    const postUrl = makePostUrl(slug);
    const ogImage = post.coverImage ?? postOgImageUrl(slug);
    const published = post.date ? new Date(post.date).toISOString() : undefined;
    const modified = post.updatedDate ? new Date(post.updatedDate).toISOString() : published;
    return {
      // template이 ' — 모승 블로그'를 붙이므로 여기선 제목만.
      title: post.title,
      description: post.description,
      keywords: [...post.tags, post.title, SITE_AUTHOR],
      authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_GITHUB }],
      creator: SITE_AUTHOR,
      publisher: SITE_AUTHOR,
      category: post.tags[0] ?? "blog",
      robots: post.noindex ? { index: false, follow: false } : { index: true, follow: true },
      // canonical은 한글 slug가 안전하게 인코딩된 절대 URL로 고정한다.
      alternates: { canonical: post.canonicalUrl ?? postUrl },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.description,
        url: postUrl,
        siteName: SITE_NAME,
        locale: "ko_KR",
        publishedTime: published,
        modifiedTime: modified,
        // openGraph.authors는 문자열 배열(top-level authors는 객체 배열 — 다른 모양).
        authors: [SITE_AUTHOR],
        tags: post.tags,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${post.title} — ${SITE_NAME}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
        images: [ogImage],
      },
      other: {
        "article:published_time": published ?? "",
        "article:modified_time": modified ?? "",
        "article:author": SITE_AUTHOR,
        "article:section": post.tags[0] ?? "blog",
      },
    };
  } catch {
    return { title: SITE_NAME, description: SITE_DESC };
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
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

  // 관련 글 — 태그를 하나라도 공유하는 다른 글 최대 3개(겹치는 태그 수 우선).
  const related = all
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .sort((a, b) => {
      const overlap = (p: typeof a) => p.tags.filter((t) => post.tags.includes(t)).length;
      return overlap(b) - overlap(a);
    })
    .slice(0, 3);

  const postUrl = makePostUrl(slug);
  const publishedISO = post.date ? new Date(post.date).toISOString() : undefined;
  const modifiedISO = post.updatedDate ? new Date(post.updatedDate).toISOString() : publishedISO;
  const structuredImage = post.coverImage ?? postOgImageUrl(slug);

  // BlogPosting — Google이 글·작성자·날짜를 리치 결과로 이해. 날짜는 반드시 ISO 8601.
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: publishedISO,
    dateModified: modifiedISO,
    author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_AUTHOR_GITHUB },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    url: postUrl,
    keywords: post.tags.join(", "),
    // og:image와 동일한 대표 이미지를 구조화 데이터에도 연결.
    image: structuredImage,
  };

  // BreadcrumbList — 마지막(현재 글) 항목은 item URL을 생략하는 게 schema.org 규약.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <article style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* 구조화 데이터 — 스키마 타입당 <script> 1개. RSC 본문이라 크롤러가 HTML에서 본다. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }} />
      <ReadingProgress />

      {/* 시각적 breadcrumb — BreadcrumbList JSON-LD와 짝. */}
      <nav aria-label="breadcrumb" style={{ marginBottom: 24, fontSize: ".82rem", color: "var(--muted)" }}>
        <ol style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            <Link href="/" style={{ color: "var(--muted)" }}>홈</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog" style={{ color: "var(--muted)" }}>블로그</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: "var(--fg)", fontWeight: 600 }}>
            {post.title}
          </li>
        </ol>
      </nav>

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

      {/* 이전·다음 글 내비 — 모바일에선 globals.css의 .post-nav 규칙으로 세로 스택 */}
      <nav
        className="post-nav"
        style={{
          display: "flex",
          gap: 12,
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
        }}
      >
        {prev ? (
          <Link href={postPath(prev.slug)} style={{ flex: 1, textDecoration: "none", color: "var(--fg)" }}>
            <span style={{ color: "var(--muted)", fontSize: ".75rem", display: "block" }}>← 이전 글</span>
            <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{prev.title}</span>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <Link href={postPath(next.slug)} style={{ flex: 1, textAlign: "right", textDecoration: "none", color: "var(--fg)" }}>
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

      {/* 관련 글 — 같은 태그를 공유하는 글로 내부 링크를 잇는다(link equity + 체류). */}
      {related.length > 0 && (
        <section style={{ marginTop: 56, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em", marginBottom: 16 }}>
            관련 글
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      <Comments postSlug={slug} />
    </article>
  );
}
