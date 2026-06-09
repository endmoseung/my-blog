import type { Metadata } from "next";
import TagFilter from "@/components/TagFilter";
import { getAllPosts } from "@/lib/posts";
import { jsonLdHtml } from "@/lib/json-ld";
import { SITE_NAME, absoluteUrl, postUrl } from "@/lib/site";

const title = "글";
const description = `${SITE_NAME}의 전체 글 목록입니다. 개발, 회고, 프로젝트 경험을 태그별로 탐색할 수 있습니다.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: `${title} — ${SITE_NAME}`,
    description,
    url: "/blog",
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: `${title} — ${SITE_NAME}`, description },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  // Blog + ItemList — 목록 페이지 자체도 글 컬렉션임을 구조화 데이터로 명시한다.
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} 글 목록`,
    description,
    url: absoluteUrl("/blog"),
    inLanguage: "ko-KR",
    blogPost: posts
      .filter((p) => !p.noindex)
      .slice(0, 20)
      .map((p) => ({
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
    itemListElement: posts
      .filter((p) => !p.noindex)
      .slice(0, 20)
      .map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: postUrl(p.slug),
        name: p.title,
      })),
  };

  // 태그를 빈도순으로 — 자주 쓰인 태그가 앞으로(TagFilter가 더보기 경계로 사용).
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1] !== 0 ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .map(([tag, count]) => ({ tag, count }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(blogLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(itemListLd) }} />
      <h1 style={{ fontWeight: 800, fontSize: "2.2rem", marginBottom: 22, letterSpacing: "-0.03em" }}>
        글 목록
      </h1>
      <TagFilter posts={posts} tags={tags} />
    </>
  );
}
