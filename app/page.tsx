import type { Metadata } from "next";
import PostExplorer from "@/components/home/PostExplorer";
import RollingWord from "@/components/home/RollingWord";
import { getAllPosts } from "@/lib/posts";
import { jsonLdHtml } from "@/lib/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESC, postUrl } from "@/lib/site";

// 홈은 title.absolute로 ' — 모승 블로그' 접미사를 막아 '모승 블로그 — 모승 블로그' 중복을 피한다.
export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESC,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    url: "/",
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC },
};

export default function Home() {
  const posts = getAllPosts();

  // WebSite + SearchAction — Google 사이트링크 검색박스 후보. /search?q={...}로 연결.
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Blog + ItemList — /blog 목록을 홈으로 통합했으므로 컬렉션 구조화 데이터도 홈이 가진다.
  const indexable = posts.filter((p) => !p.noindex).slice(0, 20);
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} 글 목록`,
    description: SITE_DESC,
    url: SITE_URL,
    inLanguage: "ko-KR",
    blogPost: indexable.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: postUrl(p.slug),
      datePublished: p.date,
      dateModified: p.updatedDate ?? p.date,
      description: p.description,
    })),
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} 최신 글`,
    itemListElement: indexable.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: postUrl(p.slug),
      name: p.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(blogLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(itemListLd) }} />

      <section style={{ padding: "56px 0 58px" }}>
        <p style={{ fontSize: 15, color: "var(--dim)", marginBottom: 14 }}>
          <span className="wave">👋</span> 안녕하세요, 프론트엔드 엔지니어 김승모입니다.
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 38px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.35,
          }}
        >
          웹을 <RollingWord />
          <br />그 과정을 여기에 남깁니다.
        </h1>
        <p style={{ marginTop: 16, fontSize: 15, color: "var(--dim)", maxWidth: "46ch" }}>
          React, Next.js, AWS — 그리고 이직과 회고까지. velog 시절부터 쌓아온{" "}
          {posts.length}편의 기록.
        </p>
      </section>

      <PostExplorer posts={posts} />
    </>
  );
}
