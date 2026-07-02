"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PostMeta } from "@/lib/posts";

const TOP_TAG_COUNT = 8;

// 연도 내림차순 그룹. date가 빈 글은 마지막 "기타"로.
function groupByYear(posts: PostMeta[]) {
  const map = new Map<string, PostMeta[]>();
  for (const p of posts) {
    const y = p.date ? p.date.slice(0, 4) : "기타";
    map.set(y, [...(map.get(y) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function mmdd(date: string) {
  return date ? date.slice(5).replace("-", ".") : "";
}

export default function PostExplorer({ posts }: { posts: PostMeta[] }) {
  const [tag, setTag] = useState<string | null>(null);

  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_TAG_COUNT).map(([t]) => t);
  }, [posts]);

  const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);
  const years = groupByYear(rest);

  /* ── 호버 프리뷰: 카드 1개를 커서가 lerp로 따라다님 ──────────────
     hover 가능한 포인터 + 720px 이상 + reduced-motion 아님일 때만 활성.
     위치 갱신은 rAF에서 style 직접 조작 — 리렌더 없음. */
  const card = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PostMeta | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current =
      matchMedia("(hover: hover) and (min-width: 720px)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!preview) return;
    let raf = 0;
    let px = -9999, py = -9999, tx = -9999, ty = -9999, first = true;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => {
      if (first && tx !== -9999) { px = tx; py = ty; first = false; }
      px += (tx - px) * 0.14;
      py += (ty - py) * 0.14;
      const el = card.current;
      if (el) {
        const w = el.offsetWidth;
        let x = px + 26;
        if (x + w > innerWidth - 16) x = px - w - 26;
        el.style.left = `${x}px`;
        el.style.top = `${Math.min(py + 18, innerHeight - el.offsetHeight - 16)}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => { removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [preview]);

  const enter = (p: PostMeta) => { if (enabled.current) setPreview(p); };
  const leave = () => setPreview(null);

  const Row = ({ p }: { p: PostMeta }) => (
    <Link
      className="row"
      href={`/blog/${p.slug}`}
      onMouseEnter={() => enter(p)}
      onMouseLeave={leave}
    >
      <span className="row-t">{p.title}</span>
      <span className="row-d">{mmdd(p.date)}</span>
      <span className="row-go" aria-hidden>→</span>
    </Link>
  );

  return (
    <>
      {/* 태그 필터 */}
      <div className="flex flex-wrap gap-2" style={{ paddingBottom: 24 }}>
        <button className={`tag${tag === null ? " on" : ""}`} onClick={() => setTag(null)}>
          전체
        </button>
        {topTags.map((t) => (
          <button key={t} className={`tag${tag === t ? " on" : ""}`} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>

      {/* featured — 연도 그룹 위에 accent 라벨로 구분 */}
      {featured.length > 0 && (
        <section>
          <div className="yr" style={{ color: "var(--accent)" }}>FEATURED</div>
          {featured.map((p) => <Row key={p.slug} p={p} />)}
        </section>
      )}

      {/* 연도별 리스트 */}
      {years.map(([year, list]) => (
        <section key={year}>
          <div className="yr">{year}</div>
          {list.map((p) => <Row key={p.slug} p={p} />)}
        </section>
      ))}

      {filtered.length === 0 && (
        <p style={{ color: "var(--dim)", padding: "40px 0" }}>이 태그의 글이 아직 없어요.</p>
      )}

      {/* 호버 프리뷰 카드 */}
      <div ref={card} className={`preview-card${preview ? " on" : ""}`} aria-hidden>
        {preview && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "var(--accent)", marginBottom: 7 }}>
              {preview.tags.join(" · ") || "글"}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--dim)",
                lineHeight: 1.65,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview.excerpt}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600 }}>
              {preview.minRead}분 읽기 →
            </div>
          </>
        )}
      </div>
    </>
  );
}
