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
      aria-label="테마 전환"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{
        fontSize: 18,
        background: "none",
        border: 0,
        cursor: "pointer",
        lineHeight: 1,
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2) rotate(12deg)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
