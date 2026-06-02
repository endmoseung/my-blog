"use client";
import { useEffect, useRef, useState } from "react";

// 스크롤 시 아래에서 부드럽게 떠오르는 등장 — CSS + IntersectionObserver.
// motion 라이브러리(약 700KB) 대신 순수 CSS라 번들이 가볍다.
// prefers-reduced-motion은 globals.css 전역 규칙이 transition을 무력화해 자동 존중.
export default function FadeIn({
  children,
  delay = 0,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "-40px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
