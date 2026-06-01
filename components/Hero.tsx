"use client";
import { useEffect, useRef } from "react";

// 우리만의 인터랙티브 히어로 — 마우스를 따라 색색 원들이 부드럽게 모여드는 캔버스.
// ryoppippi의 점묘 인물 아바타와 완전히 다른 연출(추상 컬러 도형).
export default function Hero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Dot = { x: number; y: number; hue: number; r: number };
    const palette = [340, 45, 195, 280, 160]; // 핑크·옐로·시안·퍼플·민트
    let dots: Dot[] = [];

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    const seed = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      dots = Array.from({ length: 28 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        hue: palette[i % palette.length] + (Math.random() * 24 - 12),
        r: 10 + (i % 6) * 5,
      }));
    };
    resize();
    seed();

    const mouse = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2, active: false };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => (mouse.active = false);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        // 1) 도형끼리 서로 밀어내 고르게 퍼지게(분산력)
        for (const o of dots) {
          if (o === d) continue;
          const ox = d.x - o.x, oy = d.y - o.y;
          const od = Math.hypot(ox, oy) || 1;
          const minGap = d.r + o.r + 14;
          if (od < minGap) {
            const push = (minGap - od) / minGap;
            d.x += (ox / od) * push * 0.8;
            d.y += (oy / od) * push * 0.8;
          }
        }
        // 2) 마우스가 가까이 오면 살짝 끌어당김(부드러운 인터랙션)
        if (mouse.active) {
          const dx = mouse.x - d.x, dy = mouse.y - d.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 220) {
            d.x += (dx / dist) * (0.6 * (1 - dist / 220));
            d.y += (dy / dist) * (0.6 * (1 - dist / 220));
          }
        } else {
          // 3) 평상시엔 아주 느린 둥둥 떠다님
          d.x += Math.sin((d.hue + d.x) * 0.01) * 0.15;
          d.y += Math.cos((d.hue + d.y) * 0.01) * 0.15;
        }
        // 경계 안에 가두기
        d.x = Math.max(d.r, Math.min(w - d.r, d.x));
        d.y = Math.max(d.r, Math.min(h - d.r, d.y));

        ctx.beginPath();
        ctx.fillStyle = `hsl(${d.hue} 92% 64% / 0.82)`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    if (reduce) {
      // 모션 비활성: 한 프레임만 정적으로
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${d.hue} 92% 64% / 0.82)`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      draw();
    }

    const onResize = () => { resize(); seed(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="mb-14">
      <canvas
        ref={ref}
        aria-hidden
        style={{
          width: "100%",
          height: 280,
          borderRadius: 24,
          display: "block",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--card)), var(--card))",
          border: "1px solid var(--line)",
          cursor: "crosshair",
        }}
      />
      <h1 style={{ fontSize: "clamp(1.7rem, 6vw, 2.6rem)", fontWeight: 800, marginTop: 28, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
        안녕! <span style={{ color: "var(--accent)" }}>반가워.</span>
        <br />
        여긴 내 생각을 푸는 곳이야.
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 12, fontSize: "clamp(.95rem, 3vw, 1.05rem)" }}>
        위 그림에 마우스를 올려봐 — 따라온다 🎈
      </p>
    </section>
  );
}
