import { describe, it, expect } from "vitest";
import { search, type SearchDoc } from "./search";

const docs: SearchDoc[] = [
  { slug: "a", title: "커피 한 잔과 코드", excerpt: "작업 루틴 얘기", tags: ["일상", "생산성"], date: "2026-05-25", body: "아침에 커피를 내린다. 커피 향이 좋다." },
  { slug: "b", title: "사이드 프로젝트", excerpt: "왜 만드냐면", tags: ["개발", "생각"], date: "2026-05-18", body: "마감도 없고 그냥 만든다." },
  { slug: "c", title: "퇴근길 산책", excerpt: "걷는 습관", tags: ["일상"], date: "2026-05-10", body: "한 정거장 일찍 내려 걷는다." },
];

describe("search", () => {
  it("제목 일치가 본문 일치보다 높은 점수", () => {
    const hits = search(docs, "커피");
    expect(hits[0].slug).toBe("a"); // 제목+본문 둘 다 맞는 a가 최상위
  });

  it("태그로도 검색된다", () => {
    const hits = search(docs, "개발");
    expect(hits.map((h) => h.slug)).toContain("b");
  });

  it("빈 쿼리는 빈 결과", () => {
    expect(search(docs, "")).toEqual([]);
    expect(search(docs, "   ")).toEqual([]);
  });

  it("매칭 없으면 빈 결과", () => {
    expect(search(docs, "외계인우주선")).toEqual([]);
  });

  it("부분 일치(부분어)도 잡는다", () => {
    const hits = search(docs, "프로젝");
    expect(hits.map((h) => h.slug)).toContain("b");
  });
});
