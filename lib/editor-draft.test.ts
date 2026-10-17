import { describe, it, expect } from "vitest";
import { parseDraft, pickStart, isDirty, type Draft } from "./editor-draft";

const base: Draft = { title: "제목", tags: ["react"], markdown: "본문", excerpt: "", featured: false, coverImage: "", slug: "글" };

describe("parseDraft", () => {
  it("깨진 값이나 빈 초안은 버린다", () => {
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(JSON.stringify({ title: "", markdown: "" }))).toBeNull();
    expect(parseDraft(null)).toBeNull();
  });
  it("예전 편집기 초안(slug·coverImage·base 없음)도 읽되 base는 비워 둔다", () => {
    const d = parseDraft(JSON.stringify({ title: "t", tags: ["a"], excerpt: "", featured: true, markdown: "m" }));
    expect(d?.value).toEqual({ title: "t", tags: ["a"], markdown: "m", excerpt: "", featured: true, coverImage: "", slug: "" });
    expect(d?.base).toBeNull();
  });
});

describe("pickStart", () => {
  it("초안이 없으면 원본으로 시작한다", () => {
    expect(pickStart(null, base, true)).toEqual({ value: base, restored: false, stale: null });
  });

  it("새 글은 초안이 있으면 복원한다", () => {
    const stored = { value: { ...base, title: "쓰던 글" }, base: null };
    expect(pickStart(stored, { ...base, title: "", markdown: "" }, false)).toEqual({ value: stored.value, restored: true, stale: null });
  });

  it("수정 모드: 원본이 그대로이고 초안이 다르면 복원한다", () => {
    const stored = { value: { ...base, markdown: "고친 본문" }, base: base };
    expect(pickStart(stored, base, true).restored).toBe(true);
  });

  it("수정 모드: 초안을 남긴 뒤 파일이 바뀌었으면 파일을 열고, 초안은 stale로 돌려준다(조용히 버리지 않게)", () => {
    const stored = { value: { ...base, markdown: "고친 본문" }, base: { ...base, markdown: "옛 원본" } };
    expect(pickStart(stored, base, true)).toEqual({ value: base, restored: false, stale: stored.value });
  });

  it("수정 모드: 원본 기록이 없는 예전 초안은 쓰지 않는다", () => {
    const stored = { value: { ...base, markdown: "tiptap이 다시 쓴 본문" }, base: null };
    expect(pickStart(stored, base, true)).toEqual({ value: base, restored: false, stale: stored.value });
  });

  it("초안이 원본과 같으면 복원으로 치지 않는다 (키 순서가 달라도)", () => {
    const reordered: Draft = { slug: "글", coverImage: "", featured: false, excerpt: "", markdown: "본문", tags: ["react"], title: "제목" };
    expect(pickStart({ value: reordered, base }, base, true).restored).toBe(false);
  });
});

describe("isDirty", () => {
  it("값이 같으면 false, 하나라도 다르면 true", () => {
    expect(isDirty({ ...base }, base)).toBe(false);
    expect(isDirty({ ...base, tags: ["react", "회고"] }, base)).toBe(true);
  });
});
