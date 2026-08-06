import type { Metadata } from "next";
import { jsonLdHtml } from "@/lib/json-ld";
import {
  SITE_URL,
  SITE_DESC,
  SITE_AUTHOR,
  SITE_AUTHOR_GITHUB,
  SITE_AUTHOR_LINKEDIN,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/site";

const description = "프론트엔드 개발자 김승모의 소개 페이지입니다. 요즘의 생각, 만든 것, 커뮤니티와 개발 경험을 기록합니다.";

// template이 ' — 모승 블로그'를 자동으로 붙인다.
export const metadata: Metadata = {
  title: "소개",
  description,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title: `소개 — ${SITE_NAME}`,
    description,
    url: "/about",
    type: "profile",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: `소개 — ${SITE_NAME}`, description },
};

export default function About() {
  // Person — 작성자를 검색엔진이 인물로 인식(E-E-A-T). sameAs로 외부 프로필 연결.
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_AUTHOR,
    url: SITE_URL,
    sameAs: [SITE_AUTHOR_GITHUB, SITE_AUTHOR_LINKEDIN],
    description: SITE_DESC,
  };

  return (
    <article style={{ lineHeight: 1.9, maxWidth: 680, margin: "0 auto" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(personLd) }} />
      <h1 style={{ fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2.1rem)", marginBottom: 18, letterSpacing: "-0.03em" }}>
        안녕하세요 <span className="wave">👋</span>
      </h1>
      <p style={{ fontSize: "1.02rem", color: "var(--dim)" }}>
        개발과 사람을 좋아하는 개발자 김승모입니다. AWS Community Builder로 활동하며
        프론트엔드를 만듭니다.
      </p>
      <p style={{ fontSize: "1.02rem", color: "var(--dim)", marginTop: 14 }}>
        개발자의 가치는 코드가 아니라 서비스와 사람에게 있다고 생각합니다.
        여기에는 요즘 하는 생각과 만든 것들을 편하게 적어둡니다. 개발 이야기는 언제든 환영이에요.
      </p>
      <p style={{ marginTop: 24, display: "flex", gap: 18 }}>
        <a
          href={SITE_AUTHOR_GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="u"
          style={{ fontWeight: 650, fontSize: 14.5 }}
        >
          GitHub →
        </a>
        <a
          href={SITE_AUTHOR_LINKEDIN}
          target="_blank"
          rel="noopener noreferrer"
          className="u"
          style={{ fontWeight: 650, fontSize: 14.5 }}
        >
          LinkedIn →
        </a>
      </p>
    </article>
  );
}
