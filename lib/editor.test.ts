import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { makeSlug, makeFrontmatter, autoExcerpt, updateMdx } from "./editor";

describe("makeSlug", () => {
  it("한글은 유지하고 공백은 하이픈으로", () => {
    expect(makeSlug("요즘 생각")).toBe("요즘-생각");
  });
  it("특수문자는 제거, 연속 하이픈은 하나로", () => {
    expect(makeSlug("요즘 생각 (feat. AI)")).toBe("요즘-생각-feat-AI");
  });
  it("앞뒤 하이픈은 잘라낸다", () => {
    expect(makeSlug("  !리액트 배우기!  ")).toBe("리액트-배우기");
  });
});

describe("makeFrontmatter", () => {
  const meta = {
    title: '따옴표 "인용" 제목',
    date: "2026-07-03",
    excerpt: "한 줄 요약",
    tags: ["회고", "AI"],
    featured: true,
  };

  it("gray-matter로 round-trip 파싱된다 (기존 65편과 같은 스키마)", () => {
    const mdx = makeFrontmatter(meta) + "\n본문입니다.\n";
    const { data, content } = matter(mdx);
    expect(data.title).toBe(meta.title);
    expect(data.date).toBe(meta.date);
    expect(data.excerpt).toBe(meta.excerpt);
    expect(data.tags).toEqual(meta.tags);
    expect(data.featured).toBe(true);
    expect(content).toContain("본문입니다.");
  });
});

describe("autoExcerpt", () => {
  it("첫 문단의 마크다운 기호를 걷어내고 150자로 자른다", () => {
    const md = "# 제목\n\n> 인용문 시작\n\n**굵은** 본문이 [링크](https://a.b)와 함께 이어진다.\n\n다음 문단.";
    const ex = autoExcerpt(md);
    expect(ex).toContain("굵은 본문이 링크와 함께 이어진다.");
    expect(ex).not.toContain("**");
    expect(ex.length).toBeLessThanOrEqual(150);
  });
  it("빈 본문이면 빈 문자열", () => {
    expect(autoExcerpt("")).toBe("");
  });
});

describe("updateMdx", () => {
  const original = `---
title: "옛 제목"
date: "2023-06-13"
excerpt: "옛 발췌"
tags: ["방송"]
featured: true
source: "https://velog.io/@endmoseung/old"
---

옛 본문.
`;
  const changes = {
    title: "새 제목",
    excerpt: "새 발췌",
    tags: ["회고", "AI"],
    featured: false,
    updatedDate: "2026-07-04",
  };

  it("미지 키(source)를 보존하고 변경 필드를 반영한다", () => {
    const out = updateMdx(original, changes, "새 본문.");
    const { data, content } = matter(out);
    expect(data.source).toBe("https://velog.io/@endmoseung/old");
    expect(data.title).toBe("새 제목");
    expect(data.tags).toEqual(["회고", "AI"]);
    expect(data.featured).toBe(false);
    expect(content.trim()).toBe("새 본문.");
  });

  it("원본 date는 유지하고 updatedDate를 기록한다", () => {
    const { data } = matter(updateMdx(original, changes, "x"));
    expect(data.date).toBe("2023-06-13");
    expect(data.updatedDate).toBe("2026-07-04");
  });
});
