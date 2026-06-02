"use client";
import { useState } from "react";

// 글 안에 박는 인터랙티브 데모 예시(Comeau식).
// 슬라이더로 hue를 바꾸면 박스 색이 실시간으로 변한다.
export default function ColorPlayground() {
  const [hue, setHue] = useState(330);
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 18,
        border: "1px solid var(--line)",
        background: "var(--card)",
        margin: "28px 0",
      }}
    >
      <div
        style={{
          height: 96,
          borderRadius: 14,
          background: `hsl(${hue} 90% 60%)`,
          marginBottom: 14,
          transition: "background 0.05s linear",
        }}
      />
      <input
        type="range"
        min={0}
        max={360}
        value={hue}
        onChange={(e) => setHue(+e.target.value)}
        style={{ width: "100%", accentColor: `hsl(${hue} 90% 60%)` }}
        aria-label="색상 조절"
        aria-valuenow={hue}
        aria-valuetext={`색상 ${hue}도`}
      />
      <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 8 }}>
        hue: {hue}° — 슬라이더를 움직여봐! 🎨
      </p>
    </div>
  );
}
