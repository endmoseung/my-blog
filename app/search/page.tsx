import SearchBox from "@/components/SearchBox";
import { getSearchDocs } from "@/lib/posts";

export const metadata = { title: "검색" };

export default function SearchPage() {
  const docs = getSearchDocs();
  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2.1rem)", marginBottom: 10, letterSpacing: "-0.03em" }}>
        검색
      </h1>
      <p style={{ color: "var(--dim)", fontSize: ".92rem", marginBottom: 20, lineHeight: 1.6 }}>
        제목·태그뿐 아니라 글 <strong style={{ color: "var(--fg)", fontWeight: 700 }}>본문 내용까지</strong> 함께 훑어,
        검색어와 가장 관련 있는 글을 의미 단위로 찾아줍니다.
      </p>
      <SearchBox docs={docs} />
    </>
  );
}
