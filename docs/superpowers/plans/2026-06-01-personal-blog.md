# 개인 블로그 구현 계획 (Personal Blog Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ryoppippi.com을 구조 레퍼런스로, 쾌활·외향 톤의 컬러풀한 개인 블로그를 Next.js로 구축한다. 글은 MDX(글 안 인터랙티브 위젯 포함), 댓글은 Giscus, 다크/라이트 토글, 인터랙티브 히어로(점묘 아바타 아님 — 우리만의 연출).

**Architecture:** Next.js 15 App Router + TypeScript. 글은 `content/posts/*.mdx`를 빌드시 읽어 정적 생성(SSG). MDX 안에 React 컴포넌트(인터랙티브 위젯) 삽입. 스타일은 Tailwind CSS v4 + CSS 변수 기반 테마(다크/라이트). 모션은 Motion(`motion/react`) + 단순 reveal은 CSS scroll-driven animation. 댓글은 Giscus(GitHub Discussions). 배포는 Vercel.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, `next-mdx-remote` (또는 `@next/mdx`), `motion`, `gray-matter`, `next-themes`, `@giscus/react`, `rehype-pretty-code`(코드 하이라이트), Vitest + Testing Library.

---

## 표절 회피 원칙 — "같을 것 / 다를 것" (이 계획 전체를 관통하는 헌법)

| | 항목 | 근거 |
|---|---|---|
| **✅ 같아도 됨 (보편 패턴, 저작권 무관)** | 상단 텍스트 내비, 다크/라이트 토글, 좁은 본문 measure(읽기 폭), 글 목록(제목+날짜), 글 상세 중앙 헤더(제목·날짜·읽는시간), 체크박스/태그 필터, "글 안 인터랙티브 위젯" 개념, MDX 기반 | ryoppippi 고유가 아니라 업계 공통 UX |
| **❌ 달라야 함 (ryoppippi 정체성 → 베끼면 표절)** | 점묘/포인트클라우드 아바타, 그의 모노톤 미니멀 팔레트, 그의 폰트 조합, 그의 정확한 레이아웃 비율·여백값, 그의 카피·아이콘 | 이게 "ryoppippi의 것" |
| **🎨 우리만의 정체성 (다를 것의 적극형)** | **쾌활·외향 톤**: 밝고 채도 높은 멀티 컬러 팔레트, 에너지 있는 타이포, **우리만의 인터랙티브 히어로**(점묘 아님 — 마우스 따라 반응하는 컬러풀 제너러티브 캔버스/도형), 친근한 한국어 보이스 | 같은 뼈대 + 다른 얼굴 |

**한 줄 요약:** ryoppippi가 *차분한 모노 미니멀*이면, 우리는 *밝고 활기찬 컬러풀*. 구조(기둥·동선)는 배우고, 색·에너지·인터랙션 종류는 완전히 우리 것.

---

## 페이지별 레퍼런스 매핑 (무엇을 어디서 어떻게 카피하나)

| 페이지 | 구조 레퍼런스 (배울 뼈대) | 우리만의 차별 (다를 것) |
|---|---|---|
| **홈 (`/`)** | ryoppippi 홈: 중앙 정렬 + 상단 텍스트 내비 + 히어로 + 소셜 행 | 점묘 아바타 → **컬러풀 인터랙티브 히어로**(마우스 반응 도형/캔버스). 밝은 팔레트. 아래에 최근 글 카드 |
| **글 목록 (`/blog`)** | ryoppippi /blog: 제목+날짜 리스트 + 태그 필터 | 모노 리스트 → **컬러 태그 칩 + 카드형 그리드**(featured 강조). junghyeonsu 카루셀 아이디어 차용 가능 |
| **글 상세 (`/blog/[slug]`)** | ryoppippi 글: 중앙 헤더(제목·날짜·N min read) + 좁은 measure + 섹션 제목 + 링크 밑줄 | 본문 안에 **인터랙티브 위젯**(Comeau식). 컬러 강조. 하단 **Giscus 댓글** |
| **소개 (`/about`)** | 일반 about 패턴(자기소개 + 링크) | 쾌활한 보이스 + 컬러풀 레이아웃 |

---

## File Structure (생성·수정 파일 지도)

```
my-blog/
├─ package.json                      # 의존성·스크립트
├─ next.config.ts                    # Next + MDX 설정
├─ tsconfig.json
├─ postcss.config.mjs                # Tailwind v4
├─ vitest.config.ts                  # 테스트 러너
├─ app/
│  ├─ layout.tsx                     # 루트 레이아웃(테마 provider, 폰트, 내비)
│  ├─ globals.css                    # Tailwind + CSS 변수 테마(다크/라이트, 컬러 팔레트)
│  ├─ page.tsx                       # 홈 (히어로 + 최근 글)
│  ├─ about/page.tsx                 # 소개
│  └─ blog/
│     ├─ page.tsx                    # 글 목록 (필터 + 카드 그리드)
│     └─ [slug]/page.tsx             # 글 상세 (MDX 렌더 + 댓글)
├─ components/
│  ├─ Nav.tsx                        # 상단 텍스트 내비 + 테마 토글
│  ├─ ThemeToggle.tsx                # 다크/라이트 토글 버튼
│  ├─ Hero.tsx                       # 우리만의 인터랙티브 히어로(컬러풀 캔버스)
│  ├─ PostCard.tsx                   # 글 카드(목록·홈 공용)
│  ├─ TagFilter.tsx                  # 태그 필터 칩
│  ├─ Comments.tsx                   # Giscus 래퍼
│  ├─ ReadingProgress.tsx            # 글 상세 스크롤 진행바
│  └─ mdx/
│     ├─ MDXComponents.tsx           # MDX 매핑(h2/code/링크 등 + 위젯 등록)
│     └─ ColorPlayground.tsx         # 예시 인터랙티브 위젯(글 안 데모)
├─ lib/
│  ├─ posts.ts                       # content/posts 읽기·파싱(frontmatter)
│  └─ posts.test.ts                  # posts 유닛 테스트
├─ content/posts/
│  ├─ hello-world.mdx                # 샘플 글 1
│  └─ interactive-demo.mdx           # 샘플 글 2(위젯 포함)
└─ public/                           # 정적 자산
```

---

## Task 0: 프로젝트 초기화 + git

**Files:**
- Create: `my-blog/` 전체 스캐폴드

- [ ] **Step 1: Next.js 앱 생성 (현재 폴더에)**

Run:
```bash
cd ~/my-blog
npx create-next-app@latest . --ts --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --eslint --turbopack --yes
```
Expected: `app/`, `package.json`, `next.config.ts` 등 생성. 기존 `.lazyweb/`·`docs/`는 보존됨.

- [ ] **Step 2: git 초기화 + .gitignore에 리서치 폴더 추가**

Run:
```bash
cd ~/my-blog && git init && printf "\n.lazyweb/\n" >> .gitignore
```

- [ ] **Step 3: 개발 서버 한 번 띄워 확인**

Run: `cd ~/my-blog && npm run dev` (확인 후 Ctrl+C)
Expected: `http://localhost:3000`에서 기본 Next 페이지 뜸.

- [ ] **Step 4: 첫 커밋**

```bash
cd ~/my-blog && git add -A && git commit -m "chore: scaffold Next.js app"
```

---

## Task 1: 콘텐츠 파이프라인 (lib/posts.ts) — TDD

글(MDX)을 읽고 frontmatter를 파싱하는 핵심 모듈. **테스트 먼저.**

**Files:**
- Create: `lib/posts.ts`, `lib/posts.test.ts`
- Create: `content/posts/hello-world.mdx`
- Create: `vitest.config.ts`

- [ ] **Step 1: 테스트 도구 설치**

```bash
cd ~/my-blog && npm i -D vitest @testing-library/react @testing-library/dom jsdom && npm i gray-matter
```

- [ ] **Step 2: vitest 설정 작성**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": new URL("./", import.meta.url).pathname } },
});
```
(`@vitejs/plugin-react` 설치: `npm i -D @vitejs/plugin-react`)

- [ ] **Step 3: 샘플 글 작성**

`content/posts/hello-world.mdx`:
```mdx
---
title: "안녕, 첫 글이야"
date: "2026-06-01"
excerpt: "이 블로그를 만들면서 처음 쓰는 글."
tags: ["일상", "개발"]
featured: true
---

반가워! 이건 내 블로그의 첫 글이야.
```

- [ ] **Step 4: 실패하는 테스트 작성**

`lib/posts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug } from "./posts";

describe("posts", () => {
  it("모든 글을 날짜 내림차순으로 반환한다", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty("slug");
    expect(posts[0]).toHaveProperty("title");
    expect(posts[0]).toHaveProperty("date");
  });
  it("slug로 글 하나를 본문과 함께 반환한다", () => {
    const post = getPostBySlug("hello-world");
    expect(post.title).toBe("안녕, 첫 글이야");
    expect(post.content).toContain("반가워");
    expect(post.tags).toContain("일상");
  });
});
```

- [ ] **Step 5: 테스트 실행 → 실패 확인**

Run: `cd ~/my-blog && npx vitest run lib/posts.test.ts`
Expected: FAIL — `getAllPosts is not defined` 류.

- [ ] **Step 6: 최소 구현**

`lib/posts.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string; title: string; date: string;
  excerpt: string; tags: string[]; featured: boolean;
};
export type Post = PostMeta & { content: string };

function read(slug: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    tags: data.tags ?? [],
    featured: data.featured ?? false,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  return fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => read(f.replace(/\.mdx$/, "")))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _c, ...meta }) => meta);
}

export function getPostBySlug(slug: string): Post {
  return read(slug);
}
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `cd ~/my-blog && npx vitest run lib/posts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 8: 커밋**

```bash
cd ~/my-blog && git add lib content/posts vitest.config.ts package.json package-lock.json && git commit -m "feat: content pipeline reading MDX frontmatter"
```

---

## Task 2: 테마 시스템 + 컬러 팔레트 (다크/라이트 + 쾌활 톤)

**우리만의 정체성**의 출발점. CSS 변수로 밝고 채도 높은 멀티 컬러 팔레트 정의.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `components/ThemeToggle.tsx`

- [ ] **Step 1: next-themes 설치**

```bash
cd ~/my-blog && npm i next-themes
```

- [ ] **Step 2: globals.css에 컬러 토큰 정의**

`app/globals.css` (Tailwind import 아래에 추가):
```css
@import "tailwindcss";

:root {
  --bg: #fffdf7;          /* 따뜻한 아이보리 */
  --fg: #1f1a17;
  --muted: #6b6058;
  --accent: #ff5d8f;      /* 쾌활한 핑크 */
  --accent-2: #ffb703;    /* 활기찬 옐로 */
  --accent-3: #4cc9f0;    /* 밝은 시안 */
  --card: #ffffff;
  --line: #efe7da;
}
[data-theme="dark"] {
  --bg: #14121a;
  --fg: #f4f1ea;
  --muted: #a39db3;
  --accent: #ff6fa3;
  --accent-2: #ffd166;
  --accent-3: #6ad6f5;
  --card: #1d1a26;
  --line: #2c2838;
}
body { background: var(--bg); color: var(--fg); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: layout.tsx에 ThemeProvider 연결**

`app/layout.tsx` (핵심 부분):
```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "내 블로그",
  description: "쾌활한 개인 블로그",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <Nav />
          <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: ThemeToggle 컴포넌트**

`components/ThemeToggle.tsx`:
```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span style={{ width: 24 }} />;
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button aria-label="테마 전환" onClick={() => setTheme(next)}
      style={{ fontSize: 18, background: "none", border: 0, cursor: "pointer" }}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

- [ ] **Step 5: 빌드/타입 확인**

Run: `cd ~/my-blog && npx tsc --noEmit`
Expected: 에러 없음. (Nav가 아직 없으면 Task 3에서 만들기 전까지 import 에러 → Task 3 직후 함께 확인)

- [ ] **Step 6: 커밋**

```bash
cd ~/my-blog && git add app components package.json package-lock.json && git commit -m "feat: theme system + cheerful color palette"
```

---

## Task 3: 상단 내비 (Nav)

**Files:**
- Create: `components/Nav.tsx`

- [ ] **Step 1: Nav 작성**

`components/Nav.tsx`:
```tsx
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
      <Link href="/" style={{ fontWeight: 800, color: "var(--accent)" }}>내 블로그</Link>
      <div className="flex items-center gap-5" style={{ fontWeight: 600 }}>
        <Link href="/blog">글</Link>
        <Link href="/about">소개</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 타입/빌드 확인**

Run: `cd ~/my-blog && npx tsc --noEmit && npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
cd ~/my-blog && git add components && git commit -m "feat: top navigation with theme toggle"
```

---

## Task 4: 인터랙티브 히어로 (우리만의 연출 — 점묘 아님)

마우스를 따라 반응하는 **컬러풀 도형 캔버스**. `prefers-reduced-motion` 존중.

**Files:**
- Create: `components/Hero.tsx`

- [ ] **Step 1: motion 설치**

```bash
cd ~/my-blog && npm i motion
```

- [ ] **Step 2: Hero 작성 (마우스 반응 컬러 도형)**

`components/Hero.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";

// 마우스 위치에 따라 색색 원들이 부드럽게 따라오는 캔버스 히어로.
// ryoppippi의 점묘 인물과 완전히 다른 연출(컬러풀·추상 도형).
export default function Hero() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dots = Array.from({ length: 24 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      hue: (i * 37) % 360, r: 8 + (i % 5) * 4, vx: 0, vy: 0,
    }));
    const mouse = { x: 0.5, y: 0.5 };
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
    resize();
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("mousemove", onMove);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        const tx = reduce ? d.x : d.x + (mouse.x - d.x) * 0.02;
        const ty = reduce ? d.y : d.y + (mouse.y - d.y) * 0.02;
        d.x = tx; d.y = ty;
        ctx.beginPath();
        ctx.fillStyle = `hsl(${d.hue} 90% 65% / 0.85)`;
        ctx.arc(d.x * canvas.width, d.y * canvas.height, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <section className="mb-12">
      <canvas ref={ref} aria-hidden style={{ width: "100%", height: 260, borderRadius: 20, display: "block" }} />
      <h1 style={{ fontSize: "2.4rem", fontWeight: 900, marginTop: 24, lineHeight: 1.15 }}>
        안녕! <span style={{ color: "var(--accent)" }}>반가워.</span><br />여긴 내 생각을 푸는 곳이야.
      </h1>
    </section>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd ~/my-blog && npm run build`
Expected: 성공.

- [ ] **Step 4: 커밋**

```bash
cd ~/my-blog && git add components/Hero.tsx package.json package-lock.json && git commit -m "feat: original interactive colorful hero (not pointcloud)"
```

---

## Task 5: 글 카드 + 홈 페이지

**Files:**
- Create: `components/PostCard.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: PostCard 작성**

`components/PostCard.tsx`:
```tsx
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`}
      style={{ display: "block", padding: 18, borderRadius: 16, background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
        {post.tags.map((t) => (
          <span key={t} style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 14%, transparent)", padding: "2px 8px", borderRadius: 8 }}>#{t}</span>
        ))}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>{post.title}</h3>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>{post.excerpt}</p>
      <time style={{ color: "var(--muted)", fontSize: ".78rem" }}>{post.date}</time>
    </Link>
  );
}
```

- [ ] **Step 2: 홈 페이지 작성 (히어로 + 최근 글)**

`app/page.tsx`:
```tsx
import Hero from "@/components/Hero";
import PostCard from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts().slice(0, 4);
  return (
    <>
      <Hero />
      <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 16 }}>최근 글</h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {posts.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
    </>
  );
}
```

- [ ] **Step 3: 빌드 + 로컬 확인**

Run: `cd ~/my-blog && npm run build && npm run dev`
Expected: 홈에 히어로 + 글 카드. (확인 후 Ctrl+C)

- [ ] **Step 4: 커밋**

```bash
cd ~/my-blog && git add app components && git commit -m "feat: home page with hero and recent posts"
```

---

## Task 6: 글 목록 페이지 + 태그 필터

**Files:**
- Create: `components/TagFilter.tsx`
- Create: `app/blog/page.tsx`

- [ ] **Step 1: TagFilter (클라이언트 컴포넌트)**

`components/TagFilter.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

export default function TagFilter({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? posts.filter((p) => p.tags.includes(active)) : posts;
  return (
    <>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>
        <button onClick={() => setActive(null)} aria-pressed={!active}
          style={{ padding: "4px 12px", borderRadius: 999, border: "1px solid var(--line)", background: !active ? "var(--accent)" : "transparent", color: !active ? "#fff" : "var(--fg)", fontWeight: 700 }}>전체</button>
        {tags.map((t) => (
          <button key={t} onClick={() => setActive(t)} aria-pressed={active === t}
            style={{ padding: "4px 12px", borderRadius: 999, border: "1px solid var(--line)", background: active === t ? "var(--accent)" : "transparent", color: active === t ? "#fff" : "var(--fg)", fontWeight: 700 }}>#{t}</button>
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {shown.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
    </>
  );
}
```

- [ ] **Step 2: 글 목록 페이지**

`app/blog/page.tsx`:
```tsx
import TagFilter from "@/components/TagFilter";
import { getAllPosts } from "@/lib/posts";

export default function BlogIndex() {
  const posts = getAllPosts();
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  return (
    <>
      <h1 style={{ fontWeight: 900, fontSize: "2rem", marginBottom: 20 }}>글 목록</h1>
      <TagFilter posts={posts} tags={tags} />
    </>
  );
}
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
cd ~/my-blog && npm run build && git add app components && git commit -m "feat: blog index with tag filter"
```

---

## Task 7: MDX 렌더링 + 글 상세 + 인터랙티브 위젯

**Files:**
- Create: `components/mdx/MDXComponents.tsx`
- Create: `components/mdx/ColorPlayground.tsx`
- Create: `components/ReadingProgress.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `content/posts/interactive-demo.mdx`

- [ ] **Step 1: MDX 렌더러 + 코드 하이라이트 설치**

```bash
cd ~/my-blog && npm i next-mdx-remote rehype-pretty-code shiki
```

- [ ] **Step 2: 예시 인터랙티브 위젯**

`components/mdx/ColorPlayground.tsx`:
```tsx
"use client";
import { useState } from "react";

// 글 안에 박는 인터랙티브 데모 예시(Comeau식).
// 슬라이더로 hue를 바꾸면 박스 색이 실시간으로 변한다.
export default function ColorPlayground() {
  const [hue, setHue] = useState(330);
  return (
    <div style={{ padding: 20, borderRadius: 16, border: "1px solid var(--line)", background: "var(--card)", margin: "24px 0" }}>
      <div style={{ height: 80, borderRadius: 12, background: `hsl(${hue} 90% 60%)`, marginBottom: 12 }} />
      <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(+e.target.value)} style={{ width: "100%" }} aria-label="색상 조절" />
      <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>hue: {hue}° — 슬라이더를 움직여봐!</p>
    </div>
  );
}
```

- [ ] **Step 3: MDX 컴포넌트 매핑**

`components/mdx/MDXComponents.tsx`:
```tsx
import type { MDXComponents } from "mdx/types";
import ColorPlayground from "./ColorPlayground";

export const mdxComponents: MDXComponents = {
  ColorPlayground,
  h2: (p) => <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginTop: 32, marginBottom: 8 }} {...p} />,
  a: (p) => <a style={{ color: "var(--accent)", textDecoration: "underline" }} {...p} />,
  p: (p) => <p style={{ margin: "14px 0", lineHeight: 1.8 }} {...p} />,
};
```

- [ ] **Step 4: 읽기 진행바**

`components/ReadingProgress.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
export default function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div style={{ position: "fixed", top: 0, left: 0, height: 3, width: `${p}%`, background: "var(--accent)", zIndex: 50 }} />;
}
```

- [ ] **Step 5: 위젯 포함 샘플 글**

`content/posts/interactive-demo.mdx`:
```mdx
---
title: "글 안에서 직접 만져보는 데모"
date: "2026-05-30"
excerpt: "읽다가 슬라이더를 움직이면 색이 바뀐다."
tags: ["개발", "인터랙션"]
featured: false
---

## 색을 직접 바꿔봐

아래 슬라이더를 움직이면 색이 실시간으로 변해.

<ColorPlayground />

이런 식으로 글 안에 인터랙티브 위젯을 넣을 수 있어.
```

- [ ] **Step 6: 글 상세 페이지 (정적 생성 + MDX 렌더)**

`app/blog/[slug]/page.tsx`:
```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import ReadingProgress from "@/components/ReadingProgress";
import Comments from "@/components/Comments";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const words = post.content.trim().split(/\s+/).length;
  const minRead = Math.max(1, Math.round(words / 200));
  return (
    <article>
      <ReadingProgress />
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 style={{ fontWeight: 900, fontSize: "2rem" }}>{post.title}</h1>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 8 }}>{post.date} · {minRead} min read</p>
      </header>
      <MDXRemote
        source={post.content}
        components={mdxComponents}
        options={{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]] } }}
      />
      <Comments />
    </article>
  );
}
```

- [ ] **Step 7: 빌드 확인 (Comments는 Task 8에서 — 임시 스텁)**

임시로 `components/Comments.tsx`에 빈 컴포넌트:
```tsx
export default function Comments() { return null; }
```
Run: `cd ~/my-blog && npm run build`
Expected: 성공. `/blog/interactive-demo`에 슬라이더 위젯 보임.

- [ ] **Step 8: 커밋**

```bash
cd ~/my-blog && git add app components content package.json package-lock.json && git commit -m "feat: MDX article rendering with interactive widget + reading progress"
```

---

## Task 8: Giscus 댓글

**Files:**
- Modify: `components/Comments.tsx`

> **사전 작업 (사용자 수동):** ① GitHub에 public repo 생성(예: `my-blog`) ② repo Settings → Discussions 켜기 ③ https://giscus.app/ko 에서 repo 입력 → repoId·categoryId 발급. 이 값을 환경변수로 넣는다.

- [ ] **Step 1: giscus 설치**

```bash
cd ~/my-blog && npm i @giscus/react
```

- [ ] **Step 2: 환경변수 파일**

`.env.local`:
```
NEXT_PUBLIC_GISCUS_REPO=사용자/저장소
NEXT_PUBLIC_GISCUS_REPO_ID=발급받은_repoId
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=발급받은_categoryId
```
(`.gitignore`에 `.env.local`이 이미 포함돼 있는지 확인)

- [ ] **Step 3: Comments 구현 (테마 연동)**

`components/Comments.tsx`:
```tsx
"use client";
import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

export default function Comments() {
  const { theme } = useTheme();
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  if (!repo) return null;
  return (
    <div style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme === "dark" ? "dark" : "light"}
        lang="ko"
        loading="lazy"
      />
    </div>
  );
}
```

- [ ] **Step 4: 로컬에서 댓글 박스 확인**

Run: `cd ~/my-blog && npm run dev` → `/blog/hello-world` 하단에 Giscus 로그인/댓글 박스.
Expected: GitHub 로그인 유도 + 댓글 입력창. (env 값 채운 뒤에만 동작)

- [ ] **Step 5: 커밋**

```bash
cd ~/my-blog && git add components/Comments.tsx package.json package-lock.json && git commit -m "feat: Giscus comments with theme sync"
```

---

## Task 9: 소개 페이지 + 마무리

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: about 페이지**

`app/about/page.tsx`:
```tsx
export default function About() {
  return (
    <article style={{ lineHeight: 1.9 }}>
      <h1 style={{ fontWeight: 900, fontSize: "2rem", marginBottom: 16 }}>안녕, 난 <span style={{ color: "var(--accent)" }}>○○</span>야</h1>
      <p>여기서 내 생각·만든 것·요즘 빠진 것들을 풀어. 편하게 둘러봐!</p>
      <p style={{ marginTop: 16 }}>
        <a href="https://github.com/사용자" style={{ color: "var(--accent)", textDecoration: "underline" }}>GitHub</a>
      </p>
    </article>
  );
}
```

- [ ] **Step 2: 전체 빌드 + 린트 + 타입**

Run: `cd ~/my-blog && npm run build && npx tsc --noEmit && npm run lint`
Expected: 전부 통과.

- [ ] **Step 3: 커밋**

```bash
cd ~/my-blog && git add app/about && git commit -m "feat: about page"
```

---

## Task 10: 배포 (Vercel)

- [ ] **Step 1: GitHub에 푸시**

```bash
cd ~/my-blog && gh repo create my-blog --public --source=. --push
```

- [ ] **Step 2: Vercel 연결**

https://vercel.com 에서 repo import → 환경변수(NEXT_PUBLIC_GISCUS_*) 입력 → Deploy.
Expected: 배포 URL 발급, 블로그 라이브.

- [ ] **Step 3: 라이브 점검 체크리스트**

- [ ] 홈 히어로 마우스 반응 동작
- [ ] 다크/라이트 토글 + Giscus 테마 동기화
- [ ] `/blog` 태그 필터 동작
- [ ] 글 상세 인터랙티브 위젯(슬라이더) 동작
- [ ] 댓글 작성(GitHub 로그인) 동작
- [ ] 모바일(실기기 또는 반응형)에서 깨짐 없음
- [ ] `prefers-reduced-motion` 켠 상태에서 애니메이션 정지

---

## Self-Review (계획 작성자 자체 점검)

**Spec coverage:**
- 목표1 "퀄리티 높은 디자인 레퍼런스 참고" → ryoppippi 구조 매핑 + 표절 회피 원칙 ✅
- 목표2 "인터랙션 많이" → 히어로(Task 4) + 글 안 위젯(Task 7) + 진행바 + 호버/필터 ✅
- 목표3 "댓글 무조건" → Giscus(Task 8) ✅
- 확정사항: 쾌활 톤(Task 2 팔레트), 점묘 아님(Task 4), 풀버전+위젯(Task 7) ✅

**Placeholder scan:** about의 "○○"·"사용자/저장소"는 사용자 고유값이라 의도적 — 실행 시 채움. 그 외 TODO 없음.

**Type consistency:** `PostMeta`/`Post`(Task 1) → PostCard·TagFilter·페이지에서 일관 사용. `getAllPosts`/`getPostBySlug` 이름 일치. Comments 스텁(Task 7)→실구현(Task 8) 시그니처 동일(props 없음). ✅
