"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { search, type SearchDoc } from "@/lib/search";
import { postPath } from "@/lib/site";

export default function SearchBox({ docs }: { docs: SearchDoc[] }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => (q.trim() ? search(docs, q) : []), [q, docs]);

  return (
    <div>
      {/* 라인형 인풋 — 하단 보더만, 포커스 시 accent로 */}
      <input
        autoFocus
        type="search"
        aria-label="글 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="무엇이든 검색해보세요 — 제목, 내용, 태그…"
        style={{
          width: "100%",
          padding: "12px 2px",
          fontSize: "1.05rem",
          border: "none",
          borderBottom: "1px solid var(--line)",
          background: "transparent",
          color: "var(--fg)",
          fontFamily: "inherit",
          outline: "none",
          borderRadius: 0,
          transition: "border-color 0.3s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--line)")}
      />

      <div role="region" aria-live="polite" aria-label="검색 결과" style={{ marginTop: 10 }}>
        {q.trim() === "" ? (
          <p style={{ color: "var(--dim)", fontSize: ".95rem", padding: "14px 0" }}>
            검색어를 입력하면 글을 찾아드려요.
          </p>
        ) : hits.length === 0 ? (
          <p style={{ color: "var(--dim)", fontSize: ".95rem", padding: "14px 0" }}>
            “{q}” 에 맞는 글이 없네요. 다른 말로 찾아볼까요?
          </p>
        ) : (
          <>
            <p style={{ color: "var(--dim)", fontSize: ".8rem", padding: "12px 0 4px" }}>{hits.length}개 찾음</p>
            {hits.map((h) => (
              <Link key={h.slug} href={postPath(h.slug)} className="row">
                <span>
                  <span className="row-t">{h.title}</span>
                  <span
                    style={{
                      display: "block",
                      color: "var(--dim)",
                      fontSize: 12.5,
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "52ch",
                    }}
                  >
                    {h.excerpt}
                  </span>
                </span>
                <span className="row-d">{h.date ? h.date.slice(0, 10) : ""}</span>
                <span className="row-go" aria-hidden>→</span>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
