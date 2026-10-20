// 로컬 에디터(/editor)의 순수 로직 — 파일 IO 없음, 단위 테스트 대상.
import matter from "gray-matter";

export type DraftMeta = {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  featured: boolean;
  coverImage?: string;
};

// 제목 → 파일명 slug. 한글 유지(기존 65편 컨벤션), 공백→하이픈, 특수문자 제거.
export function makeSlug(title: string): string {
  return title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // 문자·숫자·공백·하이픈만 남김 (한글은 \p{L})
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// 기존 글과 동일한 frontmatter 모양(더블쿼트 스칼라 + 인라인 배열)을 직접 조립.
// JSON.stringify의 이스케이프가 그대로 유효한 YAML 더블쿼트 스칼라라 안전하다.
export function makeFrontmatter(meta: DraftMeta): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(meta.title)}`,
    `date: ${JSON.stringify(meta.date)}`,
    `excerpt: ${JSON.stringify(meta.excerpt)}`,
    `tags: [${meta.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    `featured: ${meta.featured}`,
    ...(meta.coverImage ? [`coverImage: ${JSON.stringify(meta.coverImage)}`] : []),
    "---",
  ];
  return lines.join("\n") + "\n";
}

// 오늘 날짜(YYYY-MM-DD). toISOString()은 UTC라 KST 00:00~08:59에 쓰면 전날로 찍힌다.
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// 태그 입력값 → 태그 목록. velog처럼 쉼표로 여러 개를 한 번에 넣을 수 있다.
// 기존 글의 태그(known)와 대소문자만 다르면 기존 표기를 쓴다 — react·React가 따로 생기지 않게.
export function addTags(existing: string[], raw: string, known: string[] = []): string[] {
  const next = [...existing];
  for (const part of raw.split(",")) {
    const typed = part.trim().replace(/^#+/, "").trim();
    if (!typed) continue;
    const tag = known.find((k) => sameTag(k, typed)) ?? typed;
    if (!next.some((t) => sameTag(t, tag))) next.push(tag);
  }
  return next;
}

export type ImageMove = { from: string; to: string };

// 편집기가 올린 이미지 주소: /images/<폴더>/<파일>. 바깥 사이트 주소 속 /images/는 잡지 않게
// 줄 맨 앞·공백·( · 따옴표 · = 바로 뒤에서 시작하는 것만 본다.
// 편집기는 한 단계 폴더에만 올리므로 /images/a/b/c.png처럼 더 깊은 주소는 건드리지 않는다.
// 끝을 주소가 끝나는 글자로 못 박아야 한다 — 「다음이 / 가 아님」만 보면 정규식이 파일 이름을 줄여(b/ → 「b」 앞) 다시 맞춘다.
const LOCAL_IMAGE = /(?<=^|[\s("'=])\/images\/([^/\s()"'<>\]]+)\/([^/\s()"'<>\]]+)(?=[\s)"'<>\]]|$)/g;

// 새 글을 출간할 때 이 글의 이미지를 최종 주소 폴더(public/images/<slug>/)로 옮길 목록.
// 올릴 때는 그 순간의 제목(제목 전이면 draft)으로 폴더를 정해서, 제목이나 URL을 바꾸면 폴더가 어긋난다.
// 이미 있는 글의 폴더(ownedByPost)에 든 이미지는 그 글 것이라 건드리지 않는다.
export function planImageMoves(texts: string[], slug: string, ownedByPost: (dir: string) => boolean): ImageMove[] {
  const moves = new Map<string, ImageMove>();
  for (const text of texts) {
    for (const [url, dir, file] of text.matchAll(LOCAL_IMAGE)) {
      if (dir === slug || dir === "." || dir === ".." || file === "." || file === ".." || ownedByPost(dir)) continue;
      moves.set(url, { from: url, to: `/images/${slug}/${file}` });
    }
  }
  return [...moves.values()];
}

export function rewriteImageUrls(text: string, moves: ImageMove[]): string {
  const to = new Map(moves.map((m) => [m.from, m.to]));
  return text.replace(LOCAL_IMAGE, (url) => to.get(url) ?? url);
}

// 본문 첫 실문단에서 마크다운 기호를 걷어낸 150자 발췌.
// 헤딩·인용·코드블록은 건너뛰고 일반 문단을 찾는다.
export function autoExcerpt(markdown: string): string {
  const paragraphs = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith(">") && !p.startsWith("!["));
  const first = paragraphs[0] ?? "";
  const plain = first
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크는 라벨만
    .replace(/<[^>]+>/g, " ") // JSX 태그
    .replace(/[#>*`_~]/g, "") // 강조 기호
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 150);
}

// 기존 글 수정 — 미지 frontmatter 키(source 등)를 보존하며 변경분만 병합해
// 완성 mdx 문자열을 돌려준다. date는 원본 유지, updatedDate만 갱신.
// coverImage: 값이 있으면 쓰고, 빈 문자열이면 지우고, 생략하면 원본 그대로.
export function updateMdx(
  originalRaw: string,
  changes: { title: string; excerpt: string; tags: string[]; featured: boolean; updatedDate: string; coverImage?: string },
  markdown: string,
): string {
  const { data } = matter(originalRaw);
  const merged: Record<string, unknown> = {
    ...data,
    title: changes.title,
    updatedDate: changes.updatedDate,
    excerpt: changes.excerpt,
    tags: changes.tags,
    featured: changes.featured,
  };
  if (changes.coverImage !== undefined) {
    if (changes.coverImage) merged.coverImage = changes.coverImage;
    else delete merged.coverImage;
  }

  // 표준 키를 고정 순서로 먼저, 그 외 키는 원본 등장 순서대로 뒤에.
  const canonical = ["title", "date", "updatedDate", "excerpt", "tags", "featured"];
  const keys = [...canonical.filter((k) => merged[k] !== undefined), ...Object.keys(merged).filter((k) => !canonical.includes(k))];

  const yamlValue = (v: unknown): string => {
    if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(String(x))).join(", ")}]`;
    if (typeof v === "boolean" || typeof v === "number") return String(v);
    return JSON.stringify(String(v));
  };

  const lines = ["---", ...keys.map((k) => `${k}: ${yamlValue(merged[k])}`), "---"];
  return lines.join("\n") + "\n\n" + markdown.trim() + "\n";
}
