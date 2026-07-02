import { jsonLdHtml } from "@/lib/json-ld";
import { SITE_URL, SITE_DESC, SITE_AUTHOR, SITE_AUTHOR_GITHUB } from "@/lib/site";

// template이 ' — 내 블로그'를 자동으로 붙인다.
export const metadata = { title: "소개" };

export default function About() {
  // Person — 작성자를 검색엔진이 인물로 인식(E-E-A-T). sameAs로 외부 프로필 연결.
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_AUTHOR,
    url: SITE_URL,
    sameAs: [SITE_AUTHOR_GITHUB],
    description: SITE_DESC,
  };

  return (
    <article style={{ lineHeight: 1.9, maxWidth: 680, margin: "0 auto" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(personLd) }} />
      <h1 style={{ fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2.1rem)", marginBottom: 18, letterSpacing: "-0.03em" }}>
        안녕하세요 <span className="wave">👋</span>
      </h1>
      <p style={{ fontSize: "1.02rem", color: "var(--dim)" }}>
        여기서 요즘 무슨 생각 하며 사는지, 만든 것들, 빠져 있는 것들을 적어둡니다.
        솔직하고 편하게 쓰려고 해요. 천천히 둘러봐 주세요.
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={SITE_AUTHOR_GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="u"
          style={{ fontWeight: 650, fontSize: 14.5 }}
        >
          GitHub →
        </a>
      </p>
    </article>
  );
}
