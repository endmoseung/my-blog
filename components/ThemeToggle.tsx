"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
