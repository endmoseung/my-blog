"use client";
import { useEffect, useRef } from "react";

// 상단 2px 스크롤 진행 헤어라인. 본문 페이지에선 읽기 진행률 역할.
// state 대신 ref 직접 조작 — 스크롤마다 리렌더하지 않는다.
export default function ScrollHairline() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar.current) bar.current.style.width = `${pct}%`;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return <div ref={bar} className="hairline" aria-hidden />;
}
