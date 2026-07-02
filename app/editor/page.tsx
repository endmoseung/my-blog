import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/posts";
import EditorShell from "./EditorShell";

export const metadata = { title: "에디터 (로컬)", robots: { index: false, follow: false } };

// 로컬 전용 글쓰기 에디터 — 프로덕션 빌드에선 404.
export default function EditorPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  // 기존 글들의 태그를 빈도순으로 — 클릭해서 고르게
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const knownTags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  return <EditorShell knownTags={knownTags} />;
}
