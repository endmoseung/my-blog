import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>404</h1>
      <p style={{ color: "var(--muted)", marginTop: 12, fontSize: "1.05rem" }}>
        찾는 페이지가 없네요. 길을 잃으셨나봐요.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "10px 20px",
          borderRadius: 999,
          background: "var(--accent)",
          color: "var(--bg)",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
