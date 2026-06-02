import SearchBox from "@/components/SearchBox";
import { getSearchDocs } from "@/lib/posts";

export const metadata = { title: "검색 — 내 블로그" };

export default function SearchPage() {
  const docs = getSearchDocs();
  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 20, letterSpacing: "-0.02em" }}>
        검색
      </h1>
      <SearchBox docs={docs} />
    </>
  );
}
