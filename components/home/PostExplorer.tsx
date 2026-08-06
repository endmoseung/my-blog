"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import { postPath } from "@/lib/site";

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

  /* 커서 추적은 preview와 무관하게 항상 살아 있다.
     preview에 묶어두면 행을 옮길 때마다 좌표가 초기화돼, 첫 mousemove 전까지
     직전 위치에 카드가 남는다(호버 영역 밖에 떠 보이던 원인). */
  const cursor = useRef({ x: -9999, y: -9999 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => { cursor.current = { x: e.clientX, y: e.clientY }; };
    addEventListener("mousemove", onMove, { passive: true });
    return () => removeEventListener("mousemove", onMove);
  }, []);

  /* 스크롤·창 이탈 중에는 행과 카드가 어긋나므로 내린다. */
  useEffect(() => {
    if (!preview) return;
    const hide = () => setPreview(null);
    addEventListener("scroll", hide, { passive: true });
    addEventListener("blur", hide);
    return () => { removeEventListener("scroll", hide); removeEventListener("blur", hide); };
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    let raf = 0;
    // 새 호버는 항상 현재 커서에서 시작 — 직전 위치에서 날아오지 않는다.
    let px = cursor.current.x, py = cursor.current.y;
    const loop = () => {
      const { x: tx, y: ty } = cursor.current;
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
    loop(); // 페인트 전에 첫 위치를 잡아둔다.
    return () => cancelAnimationFrame(raf);
  }, [preview]);

  const enter = (p: PostMeta) => {
    if (!enabled.current) return;
    // 커서 좌표를 아직 한 번도 못 받았으면 위치를 못 잡으므로 띄우지 않는다.
    if (cursor.current.x === -9999) return;
    setPreview(p);
  };
  const leave = () => setPreview(null);

  // 태그를 바꾸면 목록이 통째로 갈리므로 호버 카드도 같이 내린다.
  const pickTag = (next: string | null) => {
    setTag(next);
    setPreview(null);
  };

  /* 컴포넌트가 아니라 순수 렌더 함수 — 컴포넌트로 두면 매 렌더마다 타입이 새로 생겨
     행 전체가 언마운트·리마운트되고, 그 과정에서 엉뚱한 mouseleave/enter가 튄다. */
  const renderRow = (p: PostMeta) => (
    <Link
      key={p.slug}
      className="row"
      href={postPath(p.slug)}
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
        <button className={`tag${tag === null ? " on" : ""}`} onClick={() => pickTag(null)}>
          전체
        </button>
        {topTags.map((t) => (
          <button key={t} className={`tag${tag === t ? " on" : ""}`} onClick={() => pickTag(tag === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>

      {/* 목록 밖으로 커서가 나가면 카드를 내린다 — 행 단위 onMouseLeave만으로는
          빠르게 빠져나갈 때 놓치는 경우가 있다. */}
      <div onMouseLeave={leave}>
        {/* featured — 연도 그룹 위에 accent 라벨로 구분 */}
        {featured.length > 0 && (
          <section>
            <div className="yr" style={{ color: "var(--accent)" }}>FEATURED</div>
            {featured.map(renderRow)}
          </section>
        )}

        {/* 연도별 리스트 */}
        {years.map(([year, list]) => (
          <section key={year}>
            <div className="yr">{year}</div>
            {list.map(renderRow)}
          </section>
        ))}
      </div>

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
