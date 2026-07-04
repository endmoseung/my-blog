// 로컬 에디터(/editor)의 순수 로직 — 파일 IO 없음, 단위 테스트 대상.
import matter from "gray-matter";

export type DraftMeta = {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  featured: boolean;
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
    "---",
  ];
  return lines.join("\n") + "\n";
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
export function updateMdx(
  originalRaw: string,
  changes: { title: string; excerpt: string; tags: string[]; featured: boolean; updatedDate: string },
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
