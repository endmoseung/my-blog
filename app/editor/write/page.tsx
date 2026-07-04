import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import EditorShell, { type EditorInitial } from "../EditorShell";

export const metadata = { title: "글쓰기 (로컬)", robots: { index: false, follow: false } };

// 로컬 전용 작성/편집 화면 — ?slug= 있으면 기존 글 편집. 프로덕션 빌드에선 404.
export default async function WritePage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { slug: rawSlug } = await searchParams;

  // 기존 글들의 태그를 빈도순으로 — 클릭해서 고르게
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const knownTags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  let initial: EditorInitial | undefined;
  if (rawSlug) {
    // 쿼리스트링은 브라우저가 인코딩해 보냄 — 파일명 매칭 전에 디코드
    let slug = rawSlug;
    try {
      slug = decodeURIComponent(rawSlug);
    } catch {
      /* 원본 그대로 */
    }
    try {
      const post = getPostBySlug(slug);
      initial = {
        slug,
        title: post.title,
        tags: post.tags,
        excerpt: post.excerpt,
        featured: post.featured,
        markdown: post.content,
        date: post.date,
      };
    } catch {
      notFound();
    }
  }

  return <EditorShell knownTags={knownTags} initial={initial} />;
}
