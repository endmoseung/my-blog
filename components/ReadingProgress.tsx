"use client";
import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    // 스크롤 이벤트마다 직접 setState하지 않고 rAF로 프레임당 1번만 갱신 — 끊김 없이 매끄럽게.
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${p}%`,
        background: "var(--fg)",
        zIndex: 50,
        transition: "width 0.15s ease-out",
      }}
    />
  );
}
