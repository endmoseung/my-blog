"use client";
import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: 2 | 3 };

// 본문 h2/h3 미니 목차 + 스크롤스파이. 1100px 이상에서만 우측 고정 표시(CSS).
// 헤딩 id는 rehype-slug가 빌드 시 부여 — 클라에선 DOM에서 수집만 한다.
export default function Toc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    // DOM 수집·구독은 프레임 뒤로 — effect 동기 setState(react-hooks 규칙) 회피
    const io = new IntersectionObserver(
      (entries) => {
        // 화면 상단 1/4 지점을 지나는 헤딩을 현재 섹션으로
        for (const en of entries) if (en.isIntersecting) setActive(en.target.id);
      },
      { rootMargin: "0% 0% -75% 0%" },
    );
    const raf = requestAnimationFrame(() => {
      const els = [...document.querySelectorAll<HTMLElement>("article .prose h2[id], article .prose h3[id]")];
      setHeadings(
        els.map((el) => ({
          id: el.id,
          text: el.textContent ?? "",
          level: el.tagName === "H2" ? 2 : 3,
        })),
      );
      els.forEach((el) => io.observe(el));
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav className="toc" aria-label="목차">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={active === h.id ? "toc-a on" : "toc-a"}
          style={{ paddingLeft: h.level === 3 ? 14 : 0 }}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
