import type { Metadata } from "next";
import SearchBox from "@/components/SearchBox";
import { getSearchDocs } from "@/lib/posts";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

const description = `${SITE_NAME}의 글을 제목, 태그, 본문 내용까지 통합 검색합니다.`;

export const metadata: Metadata = {
  title: "검색",
  description,
  alternates: { canonical: absoluteUrl("/search") },
  openGraph: {
    title: `검색 — ${SITE_NAME}`,
    description,
    url: "/search",
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: `검색 — ${SITE_NAME}`, description },
};

export default function SearchPage() {
  const docs = getSearchDocs();
  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 8, letterSpacing: "-0.02em" }}>
        검색
      </h1>
      <p style={{ color: "var(--muted)", fontSize: ".92rem", marginBottom: 20, lineHeight: 1.6 }}>
        제목·태그뿐 아니라 글 <strong style={{ color: "var(--fg)", fontWeight: 700 }}>본문 내용까지</strong> 함께 훑어,
        검색어와 가장 관련 있는 글을 의미 단위로 찾아줍니다.
      </p>
      <SearchBox docs={docs} />
    </>
  );
}
