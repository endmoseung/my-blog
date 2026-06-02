"use client";
import { useEffect, useRef } from "react";
import { makeNoise2D } from "@/lib/simplex";

// 고급 히어로 — Simplex noise flow field 파티클.
// 파티클이 noise 흐름을 타고 움직이며 컬러 트레일을 남기고,
// 마우스 근처에선 흐름이 소용돌이치듯 휘어진다. 의존성 0, canvas 2D.
export default function Hero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const noise = makeNoise2D(Math.floor(Date.parse("2026-06-02") % 9999) || 7);

    type P = { x: number; y: number; hue: number; life: number };
    let particles: P[] = [];
    const palette = [330, 45, 195, 280, 165]; // 핑크·옐로·시안·퍼플·민트
    const COUNT = 260;
    const SCALE = 0.0016; // noise 공간 스케일(작을수록 큰 흐름)
    const SPEED = 1.1;
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let t = 0;

    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    const resize = () => {
      canvas.width = W() * dpr;
      canvas.height = H() * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 배경 한 번 칠하기(트레일 누적의 바탕)
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, W(), H());
    };

    const spawn = (): P => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      hue: palette[Math.floor(Math.random() * palette.length)] + (Math.random() * 30 - 15),
      life: 60 + Math.random() * 120,
    });

    resize();
    particles = Array.from({ length: COUNT }, spawn);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    };
    const onLeave = () => (mouse.active = false);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const step = () => {
      // 트레일을 서서히 지워 잔상 효과(완전 clear 대신 반투명 덮기)
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, W(), H());
      ctx.globalCompositeOperation = "lighter"; // 색이 겹치면 밝아짐(네온)

      t += 0.0015;
      for (const p of particles) {
        // noise field에서 각도 추출
        const angle = noise(p.x * SCALE, p.y * SCALE + t) * Math.PI * 2;
        let vx = Math.cos(angle) * SPEED;
        let vy = Math.sin(angle) * SPEED;

        // 마우스 근처면 흐름을 휘저음(소용돌이)
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 160) {
            const f = (1 - d / 160) * 2.2;
            // 접선 방향으로 밀어 소용돌이
            vx += (-dy / (d || 1)) * f;
            vy += (dx / (d || 1)) * f;
          }
        }

        p.x += vx;
        p.y += vy;
        p.life -= 1;

        ctx.beginPath();
        ctx.fillStyle = `hsl(${p.hue} 90% 62% / 0.9)`;
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 경계 밖이거나 수명 끝나면 재생성
        if (p.x < 0 || p.x > W() || p.y < 0 || p.y > H() || p.life < 0) {
          Object.assign(p, spawn());
        }
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(step);
    };

    if (reduce) {
      // 모션 비활성: noise field를 한 번만 정적으로 점묘
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * W(), y = Math.random() * H();
        const hue = palette[i % palette.length];
        ctx.beginPath();
        ctx.fillStyle = `hsl(${hue} 90% 62% / 0.5)`;
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    } else {
      step();
    }

    const onResize = () => { resize(); particles = Array.from({ length: COUNT }, spawn); };
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
          height: 300,
          borderRadius: 24,
          display: "block",
          background: "radial-gradient(circle at 30% 30%, #1a1530, #0d0b16)",
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
        위 그림에 마우스를 휘저어봐 — 흐름이 따라 움직여 🌊
      </p>
    </section>
  );
}
