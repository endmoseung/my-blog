import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
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
import Toc from "@/components/post/Toc";
import Comments from "@/components/Comments";

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
  // /blog 인덱스는 홈으로 통합됐으므로 2단(홈 → 글)으로.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: post.title },
    ],
  };

  return (
    <article>
      {/* 구조화 데이터 — 스키마 타입당 <script> 1개. RSC 본문이라 크롤러가 HTML에서 본다. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }} />

      <p style={{ marginBottom: 34 }}>
        <Link href="/" className="u" style={{ fontSize: 13.5, color: "var(--dim)" }}>
          ← 글
        </Link>
      </p>

      <header style={{ marginBottom: 44 }}>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "clamp(1.7rem, 4.5vw, 2.3rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
          }}
        >
          {post.title}
        </h1>
        <p style={{ color: "var(--dim)", fontSize: 13.5, marginTop: 14 }}>
          <time dateTime={post.date}>{post.date}</time> · {post.minRead}분 읽기
        </p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
            {post.tags.map((t) => (
              <span key={t} className="tag" style={{ cursor: "default" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <Toc />

      <div className="prose">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              // defaultLang: 언어 없는 ```블록도 shiki가 plaintext로 색을 입히게 (없으면 스킵돼 무색)
              rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark", defaultLang: "plaintext" }]],
            },
          }}
        />
      </div>

      {/* 이전·다음 글 내비 — 모바일에선 globals.css의 .post-nav 규칙으로 세로 스택 */}
      <nav
        className="post-nav"
        style={{
          display: "flex",
          gap: 12,
          marginTop: 56,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
        }}
      >
        {prev ? (
          <Link href={postPath(prev.slug)} style={{ flex: 1, color: "var(--fg)" }}>
            <span style={{ color: "var(--dim)", fontSize: 12, display: "block", marginBottom: 4 }}>← 이전 글</span>
            <span className="u" style={{ fontWeight: 650, fontSize: 14.5 }}>{prev.title}</span>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <Link href={postPath(next.slug)} style={{ flex: 1, textAlign: "right", color: "var(--fg)" }}>
            <span style={{ color: "var(--dim)", fontSize: 12, display: "block", marginBottom: 4 }}>다음 글 →</span>
            <span className="u" style={{ fontWeight: 650, fontSize: 14.5 }}>{next.title}</span>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </nav>

      {/* 댓글 — 글을 다 읽은 직후 반응을 남기는 자리. 관련 글(이탈 동선)보다 위에 둔다. */}
      <Comments postSlug={slug} />

      {/* 관련 글 — 같은 태그를 공유하는 글로 내부 링크를 잇는다(link equity + 체류). */}
      {related.length > 0 && (
        <section style={{ marginTop: 56, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
          <div className="yr">관련 글</div>
          {related.map((p) => (
            <Link key={p.slug} className="row" href={postPath(p.slug)}>
              <span className="row-t">{p.title}</span>
              <span className="row-d">{p.date}</span>
              <span className="row-go" aria-hidden>→</span>
            </Link>
          ))}
        </section>
      )}
    </article>
  );
}
