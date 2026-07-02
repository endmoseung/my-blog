"use client";
import { useEffect, useState } from "react";

// 서울 시간 실시간 표시. SSR 시점엔 빈 자리로 두고(하이드레이션 mismatch 회피),
// 마운트 후 1초 간격으로 갱신.
function seoulNow() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

export default function SeoulClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(seoulNow());
    const id = setInterval(() => setTime(seoulNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      서울{" "}
      <b style={{ color: "var(--fg)", fontWeight: 650 }}>{time ?? "--:--:--"}</b>
    </span>
  );
}
