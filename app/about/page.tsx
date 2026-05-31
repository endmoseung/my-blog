export const metadata = { title: "소개 — 내 블로그" };

export default function About() {
  return (
    <article style={{ lineHeight: 1.9 }}>
      <h1 style={{ fontWeight: 800, fontSize: "2.2rem", marginBottom: 18, letterSpacing: "-0.03em" }}>
        안녕, 난 <span style={{ color: "var(--accent)" }}>○○</span>야 👋
      </h1>
      <p style={{ fontSize: "1.05rem" }}>
        여기서 내 생각·만든 것·요즘 빠진 것들을 풀어. 활기차고 솔직하게 쓰려고 해. 편하게 둘러봐!
      </p>
      <p style={{ marginTop: 20 }}>
        <a
          href="https://github.com/"
          style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}
        >
          GitHub
        </a>
      </p>
    </article>
  );
}
