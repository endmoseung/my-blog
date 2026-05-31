import TagFilter from "@/components/TagFilter";
import { getAllPosts } from "@/lib/posts";

export const metadata = { title: "글 — 내 블로그" };

export default function BlogIndex() {
  const posts = getAllPosts();
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "2.2rem", marginBottom: 22, letterSpacing: "-0.03em" }}>
        글 목록
      </h1>
      <TagFilter posts={posts} tags={tags} />
    </>
  );
}
