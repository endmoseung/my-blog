import PostCard from "@/components/PostCard";
import FadeIn from "@/components/FadeIn";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <>
      {/* 심플 타이포 헤더 (junghyeonsu의 "All Posts." 결) */}
      <FadeIn>
        <header style={{ textAlign: "center", padding: "32px 0 44px" }}>
          <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.04em", fontStyle: "italic" }}>
            All Posts.
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 10, fontSize: "1rem" }}>
            생각을 푸는 곳. 천천히 읽어줘.
          </p>
        </header>
      </FadeIn>

      {featured.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-label">Featured</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr" }}>
            {featured.map((p, i) => (
              <FadeIn key={p.slug} delay={0.05 * i}>
                <PostCard post={p} large />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-label">All</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
          {rest.map((p, i) => (
            <FadeIn key={p.slug} delay={0.04 * i}>
              <PostCard post={p} />
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
