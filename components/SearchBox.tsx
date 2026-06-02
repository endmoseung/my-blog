"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { search, type SearchDoc } from "@/lib/search";

export default function SearchBox({ docs }: { docs: SearchDoc[] }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => (q.trim() ? search(docs, q) : []), [q, docs]);

  return (
    <div>
      <input
        autoFocus
        type="search"
        aria-label="글 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="무엇이든 검색해보세요 — 제목, 내용, 태그…"
        style={{
          width: "100%",
          padding: "14px 18px",
          fontSize: "1.05rem",
          borderRadius: 14,
          border: "1px solid var(--line)",
          background: "var(--card)",
          color: "var(--fg)",
          fontFamily: "inherit",
          outline: "none",
        }}
      />

      <div role="region" aria-live="polite" aria-label="검색 결과" style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {q.trim() === "" ? (
          <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>
            검색어를 입력하면 글을 찾아드려요.
          </p>
        ) : hits.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>
            “{q}” 에 맞는 글이 없네요. 다른 말로 찾아볼까요?
          </p>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{hits.length}개 찾음</p>
            {hits.map((h) => (
              <Link
                key={h.slug}
                href={`/blog/${h.slug}`}
                className="post-card"
                style={{
                  display: "block",
                  padding: 16,
                  borderRadius: 14,
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                }}
              >
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 6 }}>
                  {h.tags.map((t) => (
                    <span key={t} style={{ fontSize: ".7rem", fontWeight: 600, color: "var(--muted)", background: "var(--chip)", padding: "2px 9px", borderRadius: 999 }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{h.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>{h.excerpt}</p>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
