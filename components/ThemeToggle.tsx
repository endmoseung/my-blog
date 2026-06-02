"use client";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

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
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <span style={{ width: 28, display: "inline-block" }} />;

  const isDark = theme === "dark";
  return (
    <button
      aria-label={isDark ? "밝은 테마로 전환" : "어두운 테마로 전환"}
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{ fontSize: 18, background: "none", border: 0, cursor: "pointer", lineHeight: 1 }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
