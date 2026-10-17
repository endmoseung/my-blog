import { describe, it, expect } from "vitest";
import { formatMarkdown, imageMarkdown, type FormatKind } from "./md-format";

// 편집 결과를 실제 문서에 적용해 [새 문서, 선택된 텍스트]로 돌려준다.
function apply(doc: string, from: number, to: number, kind: FormatKind) {
  const e = formatMarkdown(doc, from, to, kind);
  const next = doc.slice(0, e.from) + e.insert + doc.slice(e.to);
  return { doc: next, selected: next.slice(e.selFrom, e.selTo), cursor: e.selFrom };
}

describe("formatMarkdown — 감싸기(굵게·기울임·취소선·코드)", () => {
  it("선택한 글자를 ** 로 감싸고 감싼 안쪽을 선택한다", () => {
    const r = apply("안녕 세상", 3, 5, "bold");
    expect(r.doc).toBe("안녕 **세상**");
    expect(r.selected).toBe("세상");
  });

  it("이미 굵게인 글자를 다시 누르면 풀린다", () => {
    const r = apply("안녕 **세상**", 5, 7, "bold");
    expect(r.doc).toBe("안녕 세상");
    expect(r.selected).toBe("세상");
  });

  it("마커까지 포함해 선택해도 풀린다", () => {
    const r = apply("**세상**", 0, 6, "bold");
    expect(r.doc).toBe("세상");
  });

  it("선택이 없으면 자리표시 글자를 넣고 그것을 선택한다", () => {
    const r = apply("", 0, 0, "bold");
    expect(r.doc).toBe("**텍스트**");
    expect(r.selected).toBe("텍스트");
  });

  it("기울임은 한글 사이에서도 동작하도록 * 를 쓴다", () => {
    expect(apply("가나다", 1, 2, "italic").doc).toBe("가*나*다");
  });

  it("굵게 안의 글자에 기울임을 누르면 굵게를 풀지 않고 기울임을 더한다", () => {
    expect(apply("**세상**", 2, 4, "italic").doc).toBe("***세상***");
  });

  it("굵고 기울인 글자에서 기울임만 풀 수 있다", () => {
    expect(apply("***세상***", 3, 5, "italic").doc).toBe("**세상**");
  });

  it("취소선과 인라인 코드", () => {
    expect(apply("끝", 0, 1, "strike").doc).toBe("~~끝~~");
    expect(apply("npm", 0, 3, "code").doc).toBe("`npm`");
    expect(apply("`npm`", 1, 4, "code").doc).toBe("npm");
  });
});

describe("formatMarkdown — 줄 머리(제목·인용)", () => {
  it("커서가 있는 줄 전체에 제목 기호를 붙인다", () => {
    const r = apply("첫 줄\n둘째 줄", 7, 7, "h2");
    expect(r.doc).toBe("첫 줄\n## 둘째 줄");
  });

  it("다른 수준의 제목이면 바꾸고, 같은 수준이면 뗀다", () => {
    expect(apply("### 제목", 2, 2, "h1").doc).toBe("# 제목");
    expect(apply("## 제목", 4, 4, "h2").doc).toBe("제목");
  });

  it("여러 줄을 선택하면 줄마다 인용 기호를 붙이고, 다시 누르면 뗀다", () => {
    const on = apply("가\n나", 0, 3, "quote");
    expect(on.doc).toBe("> 가\n> 나");
    expect(apply(on.doc, 0, on.doc.length, "quote").doc).toBe("가\n나");
  });

  it("선택 끝이 다음 줄 맨 앞이면 그 줄은 건드리지 않는다", () => {
    expect(apply("가\n나\n다", 0, 4, "quote").doc).toBe("> 가\n> 나\n다");
  });
});

describe("formatMarkdown — 링크·코드 블록", () => {
  it("선택한 글자를 링크 문구로 쓰고 주소 자리를 선택한다", () => {
    const r = apply("공식 문서", 0, 5, "link");
    expect(r.doc).toBe("[공식 문서](https://)");
    expect(r.selected).toBe("https://");
  });

  it("선택이 없으면 링크 문구 자리를 선택한다", () => {
    const r = apply("", 0, 0, "link");
    expect(r.doc).toBe("[링크 텍스트](https://)");
    expect(r.selected).toBe("링크 텍스트");
  });

  it("코드 블록은 줄 머리에서 열고 언어를 쓸 수 있게 ``` 바로 뒤에 커서를 둔다", () => {
    const r = apply("앞 문장", 4, 4, "codeblock");
    expect(r.doc).toBe("앞 문장\n```\n\n```");
    expect(r.doc.slice(0, r.cursor)).toBe("앞 문장\n```");
  });

  it("선택한 줄을 코드 블록으로 감싼다", () => {
    expect(apply("const a = 1", 0, 11, "codeblock").doc).toBe("```\nconst a = 1\n```");
  });
});

describe("imageMarkdown", () => {
  it("줄 중간이면 새 줄에 이미지를 넣는다", () => {
    expect(imageMarkdown("글", 1, "/images/a/1.png")).toEqual({ from: 1, to: 1, insert: "\n![](/images/a/1.png)\n" });
  });
  it("줄 맨 앞이면 그 자리에 넣는다", () => {
    expect(imageMarkdown("", 0, "/x.png").insert).toBe("![](/x.png)\n");
  });
});
