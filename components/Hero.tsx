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
        const tx = mouse.active ? mouse.x : w / 2;
        const ty = mouse.active ? mouse.y : h / 2;
        // 마우스 쪽으로 살짝 끌리되 완전히 모이진 않게(반발 거리)
        const dx = tx - d.x, dy = ty - d.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = mouse.active ? 0.012 : 0.004;
        d.x += dx * pull + (dx / dist) * (dist > 120 ? 0.4 : -0.6);
        d.y += dy * pull + (dy / dist) * (dist > 120 ? 0.4 : -0.6);
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
      <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginTop: 28, lineHeight: 1.12, letterSpacing: "-0.03em" }}>
        안녕! <span style={{ color: "var(--accent)" }}>반가워.</span>
        <br />
        여긴 내 생각을 푸는 곳이야.
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 12, fontSize: "1.05rem" }}>
        위 그림에 마우스를 올려봐 — 따라온다 🎈
      </p>
    </section>
  );
}
