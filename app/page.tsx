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
        <header style={{ padding: "40px 0 48px" }}>
          <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
            요즘 무슨 생각 하며 사는지,
            <br />
            여기에 적어둡니다.
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 14, fontSize: "1.02rem" }}>
            천천히 읽어주시면 좋겠어요.
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
