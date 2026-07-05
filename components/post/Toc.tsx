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

  // 전역 smooth는 페이지 전환까지 느리게 만들어 꺼둔 상태(globals.css) —
  // 목차 클릭만 부드럽게 이동한다. reduced-motion이면 즉시 점프 유지.
  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); // scroll-margin-top(24px)은 CSS가 반영
    history.replaceState(null, "", `#${id}`); // 해시는 남기되 브라우저 기본 점프는 막음
  };

  return (
    <nav className="toc" aria-label="목차">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          onClick={(e) => go(e, h.id)}
          className={active === h.id ? "toc-a on" : "toc-a"}
          style={{ paddingLeft: h.level === 3 ? 14 : 0 }}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
