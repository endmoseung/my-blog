export const metadata = { title: "소개 — 내 블로그" };

export default function About() {
  return (
    <article style={{ lineHeight: 1.9, maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 18, letterSpacing: "-0.02em" }}>
        안녕하세요 👋
      </h1>
      <p style={{ fontSize: "1.08rem" }}>
        여기서 요즘 무슨 생각 하며 사는지, 만든 것들, 빠져 있는 것들을 적어둡니다.
        솔직하고 편하게 쓰려고 해요. 천천히 둘러봐 주세요.
      </p>
      <p style={{ marginTop: 20 }}>
        <a
          href="https://github.com/endmoseung"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}
        >
          GitHub →
        </a>
      </p>
    </article>
  );
}
