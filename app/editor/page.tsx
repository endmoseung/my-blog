import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/posts";

export const metadata = { title: "에디터 (로컬)", robots: { index: false, follow: false } };

// 로컬 전용 에디터 홈 — 새 글 쓰기 + 기존 글 목록(클릭하면 편집). 프로덕션 빌드에선 404.
export default function EditorHome() {
  if (process.env.NODE_ENV !== "development") notFound();
  const posts = getAllPosts();

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--dim)", letterSpacing: ".08em", marginBottom: 20 }}>
        LOCAL EDITOR — 이 페이지는 dev에서만 존재해요
      </p>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.7rem", letterSpacing: "-0.03em" }}>글 관리</h1>
        <Link
          href="/editor/write"
          style={{
            padding: "9px 20px",
            borderRadius: 999,
            background: "var(--fg)",
            color: "var(--bg)",
            fontWeight: 700,
            fontSize: ".9rem",
          }}
        >
          + 새 글 쓰기
        </Link>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--dim)", marginBottom: 26 }}>
        글을 클릭하면 편집 화면이 열려요. 저장은 파일 수정까지 — 커밋·푸시(발행)는 직접.
      </p>

      {posts.map((p) => (
        <Link key={p.slug} className="row" href={`/editor/write?slug=${encodeURIComponent(p.slug)}`}>
          <span className="row-t">
            {p.title}
            {p.featured && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginLeft: 8, letterSpacing: ".08em" }}>FEATURED</span>
            )}
          </span>
          <span className="row-d">{p.updatedDate ? `${p.date} · 수정 ${p.updatedDate}` : p.date}</span>
          <span className="row-go" aria-hidden>✎</span>
        </Link>
      ))}
    </div>
  );
}
