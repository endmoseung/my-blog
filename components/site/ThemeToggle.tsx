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
    // 원의 중심은 토글 버튼 중심. 키보드(Enter·Space)로 누르면 clientX/Y가 0이라
    // 화면 모서리에서 퍼지므로, 실제 구현들처럼 버튼 rect를 기준으로 잡는다.
    const box = e.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    // 가장 먼 모서리까지의 거리 — 어디서 눌러도 화면을 다 덮는다.
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement;

    // body의 배경 페이드가 원형 clip과 같이 돌면 원 바깥이 먼저 새 색으로 바뀌어
    // 경계가 퍼져 보인다 — 전환이 끝날 때까지만 페이드를 끈다.
    root.classList.add("vt-theme");

    const vt = document.startViewTransition(() => {
      // startViewTransition은 콜백 완료 시점의 DOM을 스냅샷한다 —
      // React 업데이트를 동기로 밀어넣어야 새 테마가 스냅샷에 잡힌다.
      flushSync(flip);
    });
    vt.ready.then(() => {
      // Chrome 공식 데모와 같은 값 — 원이 커지는 동안 보이는 넓이는 반지름의
      // 제곱으로 늘기 때문에, 가속(ease-in) 커브라야 체감 속도가 고르다.
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        {
          duration: 500,
          easing: "ease-in",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
    // finished는 전환이 끝나거나 중간에 스킵돼도 정착되므로 여기서 되돌린다.
    vt.finished.finally(() => root.classList.remove("vt-theme"));
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
