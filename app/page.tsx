import Hero from "@/components/Hero";
import PostCard from "@/components/PostCard";
import FadeIn from "@/components/FadeIn";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts().slice(0, 4);
  return (
    <>
      <Hero />
      <FadeIn>
        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 18, letterSpacing: "-0.02em" }}>
          최근 글
        </h2>
      </FadeIn>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {posts.map((p, i) => (
          <FadeIn key={p.slug} delay={0.06 * (i + 1)}>
            <PostCard post={p} />
          </FadeIn>
        ))}
      </div>
    </>
  );
}
