import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import FadeIn from "@/components/FadeIn";
import { getAllPosts } from "@/lib/posts";
import { jsonLdHtml } from "@/lib/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

// 홈은 title.absolute로 ' — 내 블로그' 접미사를 막아 '내 블로그 — 내 블로그' 중복을 피한다.
export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
};

export default function Home() {
  const posts = getAllPosts();
  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteLd) }} />
      {/* 심플 타이포 헤더 (junghyeonsu의 "All Posts." 결) */}
      <FadeIn>
        <header style={{ padding: "40px 0 48px" }}>
          <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
            요즘 무슨 생각 하며 사는지,
            <br />
            여기에 적어둡니다.
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 14, fontSize: "1.02rem" }}>
            천천히 읽어주시면 좋겠어요.
          </p>
        </header>
      </FadeIn>

      {featured.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-label">Featured</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr" }}>
            {featured.map((p, i) => (
              <FadeIn key={p.slug} delay={0.05 * i}>
                <PostCard post={p} large />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-label">All</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", alignItems: "stretch" }}>
          {rest.map((p, i) => (
            // delay는 위 6개까지만 단계적으로(64개 누적되면 끝 카드가 너무 늦게 뜸). height:100%로 카드가 셀을 채워 높이가 정렬됨.
            <FadeIn key={p.slug} delay={Math.min(i, 6) * 0.04} style={{ height: "100%" }}>
              <PostCard post={p} />
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
