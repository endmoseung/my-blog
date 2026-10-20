// 편집기 임시저장본(localStorage) 규칙 — 브라우저 API 없이 문자열·객체만 다루는 순수 함수.

export type Draft = {
  title: string;
  tags: string[];
  markdown: string;
  excerpt: string;
  featured: boolean;
  coverImage: string;
  slug: string;
};

// 저장 형태: 쓰던 값 + 그 초안을 시작할 때의 원본(base).
// 수정 모드에서 base가 지금 파일과 다르면, 초안을 남긴 뒤 파일이 바뀐 것이다.
export type StoredDraft = { value: Draft; base: Draft | null };

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toDraft(v: unknown): Draft | null {
  if (typeof v !== "object" || v === null) return null;
  const o: Record<string, unknown> = { ...v };
  if (typeof o.title !== "string" || typeof o.markdown !== "string") return null;
  return {
    title: o.title,
    tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
    markdown: o.markdown,
    excerpt: str(o.excerpt),
    featured: o.featured === true,
    coverImage: str(o.coverImage),
    slug: str(o.slug),
  };
}

// 예전 편집기는 Draft 필드를 맨 위에 바로 저장했다({title, tags, excerpt, featured, markdown}).
// 지금 형식은 {value, base}. 둘 다 읽는다.
export function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const nested = "value" in parsed ? toDraft(parsed.value) : null;
  const value = nested ?? toDraft(parsed);
  if (!value || (!value.title && !value.markdown)) return null;
  const base = nested && "base" in parsed ? toDraft(parsed.base) : null;
  return { value, base };
}

// 키 순서와 무관하게 비교하려고 필드를 정해진 순서로 직렬화한다.
// 본문 앞뒤 공백은 저장할 때 잘려 나가므로(app/editor/api/save) 비교에서도 뺀다.
function signature(d: Draft): string {
  return JSON.stringify([d.title, d.tags, d.markdown.trim(), d.excerpt, d.featured, d.coverImage, d.slug]);
}

export function isDirty(current: Draft, base: Draft): boolean {
  return signature(current) !== signature(base);
}

// 시작 값 고르기. 수정 모드에서는 원본이 그대로일 때만 초안을 믿는다 —
// 그래야 VS Code·git pull로 파일을 고친 뒤 낡은 초안으로 덮어쓰는 일이 없다.
// 믿지 못한 초안은 stale로 돌려준다 — 조용히 버리지 않고 사용자가 골라 열 수 있게.
export function pickStart(
  stored: StoredDraft | null,
  base: Draft,
  isEdit: boolean,
): { value: Draft; restored: boolean; stale: Draft | null } {
  if (!stored || !isDirty(stored.value, base)) return { value: base, restored: false, stale: null };
  if (isEdit) {
    if (!stored.base) return { value: base, restored: false, stale: null }; // 예전 편집기 초안 — 믿을 근거가 없다
    if (isDirty(stored.base, base)) return { value: base, restored: false, stale: stored.value };
  }
  return { value: stored.value, restored: true, stale: null };
}
