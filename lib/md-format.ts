// 편집기 툴바·단축키가 쓰는 마크다운 서식 변환 — 문서 문자열과 선택 범위만 받는 순수 함수.
// CodeMirror에 의존하지 않아야 단위 테스트로 동작을 묶어 둘 수 있다.

export type FormatKind = "h1" | "h2" | "h3" | "h4" | "bold" | "italic" | "strike" | "code" | "quote" | "link" | "codeblock";

// doc[from, to)를 insert로 바꾸고, 바꾼 뒤 문서에서 [selFrom, selTo)를 선택한다.
export type Edit = { from: number; to: number; insert: string; selFrom: number; selTo: number };

const PLACEHOLDER = "텍스트";
const LINK_PLACEHOLDER = "링크 텍스트";
const LINK_URL = "https://";

// 기울임은 _ 대신 * — CommonMark에서 _ 는 한글 사이(가_나_다)에서 강조로 인식되지 않는다.
const WRAP: Record<"bold" | "italic" | "strike" | "code", string> = { bold: "**", italic: "*", strike: "~~", code: "`" };

// pos 앞(또는 뒤)으로 같은 글자가 몇 개 이어지는지
function runBefore(doc: string, pos: number, ch: string) {
  let n = 0;
  while (pos - n - 1 >= 0 && doc[pos - n - 1] === ch) n++;
  return n;
}
function runAfter(doc: string, pos: number, ch: string) {
  let n = 0;
  while (pos + n < doc.length && doc[pos + n] === ch) n++;
  return n;
}

// * 는 굵게(**)와 기울임(*)이 같은 글자를 쓴다. 이어진 * 개수로 구분한다:
// 기울임은 홀수(* 또는 ***), 굵게는 2개 이상.
function hasMarker(run: number, marker: string) {
  if (marker === "*") return run % 2 === 1;
  return run >= marker.length;
}

function wrap(doc: string, from: number, to: number, marker: string): Edit {
  const ch = marker[0];
  const m = marker.length;
  const before = runBefore(doc, from, ch);
  const after = runAfter(doc, to, ch);

  // 선택 바깥에 마커가 있으면 푼다: **[세상]** → 세상
  if (hasMarker(before, marker) && hasMarker(after, marker)) {
    return { from: from - m, to: to + m, insert: doc.slice(from, to), selFrom: from - m, selTo: to - m };
  }

  // 마커까지 함께 선택했으면 푼다: [**세상**] → 세상
  // (굵게 ** 를 통째로 고르고 기울임을 눌렀을 때 ** 를 * 로 벗기지 않도록 같은 개수 규칙을 쓴다)
  const sel = doc.slice(from, to);
  const lead = runAfter(sel, 0, ch);
  const trail = runBefore(sel, sel.length, ch);
  if (sel.length > m * 2 && hasMarker(lead, marker) && hasMarker(trail, marker)) {
    const inner = sel.slice(m, -m);
    return { from, to, insert: inner, selFrom: from, selTo: from + inner.length };
  }

  const text = sel || PLACEHOLDER;
  return { from, to, insert: marker + text + marker, selFrom: from + m, selTo: from + m + text.length };
}

// 선택이 걸친 줄 전체 범위. 선택 끝이 다음 줄 맨 앞이면 그 줄은 빼고 센다.
function lineRange(doc: string, from: number, to: number) {
  const start = doc.lastIndexOf("\n", from - 1) + 1;
  let endAt = to;
  if (to > from && doc[to - 1] === "\n") endAt = to - 1;
  const nl = doc.indexOf("\n", endAt);
  return { start, end: nl === -1 ? doc.length : nl };
}

function prefixLines(doc: string, from: number, to: number, kind: "h1" | "h2" | "h3" | "h4" | "quote"): Edit {
  const { start, end } = lineRange(doc, from, to);
  const lines = doc.slice(start, end).split("\n");
  let next: string[];

  if (kind === "quote") {
    const allQuoted = lines.every((l) => /^>\s?/.test(l));
    next = allQuoted ? lines.map((l) => l.replace(/^>\s?/, "")) : lines.map((l) => `> ${l}`);
  } else {
    const prefix = "#".repeat(Number(kind[1])) + " ";
    const allSame = lines.every((l) => l.startsWith(prefix) && !l.startsWith(prefix.trim() + "#"));
    next = allSame
      ? lines.map((l) => l.slice(prefix.length))
      : lines.map((l) => prefix + l.replace(/^#{1,6}\s+/, ""));
  }

  const insert = next.join("\n");
  // 커서만 있었으면 줄 끝에 커서, 범위였으면 바뀐 줄 전체 선택
  const selFrom = from === to ? start + insert.length : start;
  return { from: start, to: end, insert, selFrom, selTo: start + insert.length };
}

function link(doc: string, from: number, to: number): Edit {
  const sel = doc.slice(from, to);
  if (sel) {
    const insert = `[${sel}](${LINK_URL})`;
    const urlAt = from + sel.length + 3;
    return { from, to, insert, selFrom: urlAt, selTo: urlAt + LINK_URL.length };
  }
  const insert = `[${LINK_PLACEHOLDER}](${LINK_URL})`;
  return { from, to, insert, selFrom: from + 1, selTo: from + 1 + LINK_PLACEHOLDER.length };
}

function codeblock(doc: string, from: number, to: number): Edit {
  const sel = doc.slice(from, to);
  const lead = from > 0 && doc[from - 1] !== "\n" ? "\n" : "";
  // 닫는 ``` 뒤에 글자가 붙으면 CommonMark가 블록을 닫지 않는다 → 뒤 글자는 다음 줄로
  const trail = to < doc.length && doc[to] !== "\n" ? "\n" : "";
  const insert = `${lead}\`\`\`\n${sel}\n\`\`\`${trail}`;
  // 언어 이름을 바로 칠 수 있게 여는 ``` 바로 뒤에 커서
  const cursor = from + lead.length + 3;
  return { from, to, insert, selFrom: cursor, selTo: cursor };
}

export function formatMarkdown(doc: string, from: number, to: number, kind: FormatKind): Edit {
  switch (kind) {
    case "bold":
    case "italic":
    case "strike":
    case "code":
      return wrap(doc, from, to, WRAP[kind]);
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "quote":
      return prefixLines(doc, from, to, kind);
    case "link":
      return link(doc, from, to);
    case "codeblock":
      return codeblock(doc, from, to);
  }
}

// 업로드한 이미지를 커서 자리에 넣는다. 문단 중간이면 새 줄로 뺀다.
export function imageMarkdown(doc: string, pos: number, url: string): { from: number; to: number; insert: string } {
  const atLineStart = pos === 0 || doc[pos - 1] === "\n";
  return { from: pos, to: pos, insert: `${atLineStart ? "" : "\n"}![](${url})\n` };
}
