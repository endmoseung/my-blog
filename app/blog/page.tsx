import TagFilter from "@/components/TagFilter";
import { getAllPosts } from "@/lib/posts";

export const metadata = { title: "글" };

export default function BlogIndex() {
  const posts = getAllPosts();

  // 태그를 빈도순으로 — 자주 쓰인 태그가 앞으로(TagFilter가 더보기 경계로 사용).
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1] !== 0 ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .map(([tag, count]) => ({ tag, count }));

  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "2.2rem", marginBottom: 22, letterSpacing: "-0.03em" }}>
        글 목록
      </h1>
      <TagFilter posts={posts} tags={tags} />
    </>
  );
}
