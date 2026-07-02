"use client";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

// 서버/하이드레이션 시점엔 false, 클라이언트 마운트 후 true.
// useEffect+setState 대신 useSyncExternalStore로 set-state-in-effect 회피.
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <span style={{ width: 30, display: "inline-block" }} />;

  const isDark = resolvedTheme === "dark";

  const toggle = (e: React.MouseEvent) => {
    const flip = () => setTheme(isDark ? "light" : "dark");

    // 클릭 지점에서 원형으로 번지는 전환. View Transitions 미지원(또는 reduced-motion)이면
    // globals.css의 body transition(0.45s 페이드)이 폴백을 맡는다.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      flip();
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => {
      // startViewTransition은 콜백 완료 시점의 DOM을 스냅샷한다 —
      // React 업데이트를 동기로 밀어넣어야 새 테마가 스냅샷에 잡힌다.
      flushSync(flip);
    });
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 520, easing: "cubic-bezier(.2,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  };

  return (
    <button
      aria-label={isDark ? "밝은 테마로 전환" : "어두운 테마로 전환"}
      className="theme-toggle"
      onClick={toggle}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M20 13.2A8.1 8.1 0 0 1 10.8 4 8.1 8.1 0 1 0 20 13.2z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
        </svg>
      )}
    </button>
  );
}
