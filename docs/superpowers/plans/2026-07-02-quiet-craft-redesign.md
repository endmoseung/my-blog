# Quiet Craft 리디자인 + 로컬 에디터 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** md 소스 무변경으로 화면 층을 quiet craft(여백+타이포+마이크로 인터랙션)로 교체하고, dev 전용 WYSIWYG 에디터(`/editor`)를 추가한다.

**Architecture:** 기존 Next.js 16 App Router 유지. 데이터 층(`lib/`)·SEO·댓글 서버 액션 무변경. 화면 층(`app/*.tsx`, `components/`, `globals.css`)만 재작성. 인터랙션은 클라 컴포넌트로 고립, 리스트·본문은 RSC 유지. 에디터는 `app/editor/`에 dev 가드로 격리.

**Tech Stack:** Next.js 16.2.6, React 19, Tailwind v4(토큰은 CSS 변수), next-themes(class 전략), next-mdx-remote/rsc, rehype-pretty-code, Tiptap + tiptap-markdown, gray-matter, Vitest.

**Visual SSOT:** `docs/superpowers/specs/assets/quiet-demo.html` — 토큰·간격·이징 값은 이 파일이 정본. 스펙: `docs/superpowers/specs/2026-07-02-quiet-craft-redesign-design.md`

---

## 파일 지도

```
교체  app/globals.css                 토큰 + base + prose + 유닛 스타일
교체  app/layout.tsx                  ThemeProvider class 전략, 새 Header/Footer, 640px 컨테이너
교체  app/page.tsx                    홈 RSC — posts 로드, JSON-LD 유지, PostExplorer에 위임
교체  app/blog/page.tsx               redirect("/")
교체  app/blog/[slug]/page.tsx        본문 재스킨 (SEO·JSON-LD·prev/next·related·Comments 위치 유지)
교체  app/search/page.tsx + SearchBox 재스킨
교체  app/about/page.tsx              재스킨
삭제  components/Nav.tsx·NavLink·PostCard·FadeIn·TagFilter (역할이 새 유닛으로 흡수)
신규  components/site/Header.tsx      이름. + 글/소개/RSS + ThemeToggle
신규  components/site/Footer.tsx      © + SeoulClock
신규  components/site/ThemeToggle.tsx 원형 View Transition 전환
신규  components/site/SeoulClock.tsx
신규  components/home/PostExplorer.tsx 태그필터 + 연도그룹 + 행 + HoverPreview (클라)
신규  components/home/RollingWord.tsx
신규  components/post/Toc.tsx          h2/h3 스크롤스파이 (클라)
신규  components/post/ReadingHairline.tsx (기존 ReadingProgress 대체)
유지  components/comments/* (스킨만 토큰 정렬), components/mdx/*
신규  app/editor/page.tsx              dev 가드 + EditorShell
신규  app/editor/EditorShell.tsx       Tiptap + frontmatter 폼 + 미리보기 (클라)
신규  app/editor/api/save/route.ts     mdx 파일 쓰기 (dev 가드)
신규  app/editor/api/image/route.ts    이미지 저장 (dev 가드)
신규  lib/editor.ts                    slug·frontmatter 직렬화 + 단위 테스트
```

---

### Task 1: Next 16 문서 확인 (코드 전 필수 — AGENTS.md 규칙)

- [ ] `node_modules/next/dist/docs/` 에서 다음 주제 확인: route handlers, redirect, 동적 라우트 params(Promise), View Transitions 관련 유무, `next/font` 로컬 폰트
- [ ] 확인 결과가 계획과 어긋나면 해당 Task에 반영 후 진행

### Task 2: 토큰·레이아웃·헤더·푸터

**Files:** `app/globals.css`(교체), `app/layout.tsx`(교체), 신규 `components/site/{Header,Footer,ThemeToggle,SeoulClock}.tsx`

- [ ] globals.css를 demo 토큰으로 교체. 핵심 블록:

```css
@import "tailwindcss";
:root { --bg:#fdfdfc; --fg:#161616; --dim:#8a8a86; --line:#ececea; --soft:#f4f4f2; --accent:#0f62fe; }
.dark { --bg:#111113; --fg:#ededea; --dim:#82827e; --line:#232326; --soft:#1a1a1d; --accent:#7aa2ff; }
@theme inline { --color-bg:var(--bg); --color-fg:var(--fg); --color-dim:var(--dim);
  --color-line:var(--line); --color-soft:var(--soft); --color-accent:var(--accent); }
body { background:var(--bg); color:var(--fg); transition:background .45s ease,color .45s ease; }
/* draw-underline: .u 클래스 (demo 그대로) / 행 밀림 .row / pill .tag / reduced-motion 가드 */
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
```

- [ ] layout.tsx: `ThemeProvider attribute="class" defaultTheme="system" enableSystem`, `<Header/>` `<main className="mx-auto max-w-[640px] px-6">` `<Footer/>`
- [ ] ThemeToggle: 클릭 좌표 기준 `document.startViewTransition` + `clipPath circle` 애니메이션, 미지원·reduced-motion이면 그냥 토글 (demo 스크립트 이식, next-themes `setTheme`과 결합)
- [ ] SeoulClock: `useSyncExternalStore` 마운트 가드 + `setInterval` 1s, `Asia/Seoul` 고정 타임존
- [ ] `npm run dev`로 라이트/다크 전환 확인, `npm run lint`
- [ ] Commit: `feat: quiet craft 토큰·레이아웃·헤더·푸터`

### Task 3: 홈 — PostExplorer

**Files:** `app/page.tsx`(교체), 신규 `components/home/PostExplorer.tsx`, `components/home/RollingWord.tsx`, 삭제 `components/PostCard.tsx`·`TagFilter.tsx`·`FadeIn.tsx`(다른 참조 제거 후)

- [ ] page.tsx(RSC): `getAllPosts()` → `<PostExplorer posts={posts} />`. websiteLd JSON-LD 블록 그대로 유지. 히어로(인사+RollingWord+소개)는 RSC 마크업.
- [ ] PostExplorer(클라): props `posts: PostMeta[]`
  - 태그 pill: `전체` + 빈도순 상위 8개 태그. `useState<string|null>` 필터
  - featured 글은 필터 통과분 중 최상단 구분(accent 좌보더 + FEATURED 라벨)
  - 나머지는 연도 내림차순 그룹(`post.date.slice(0,4)`), 행 = 제목+MM.DD
  - HoverPreview: 카드 1개를 fixed로 두고 `mousemove`→rAF lerp(0.14) 추적, `mouseenter`시 발췌·태그·읽기시간 주입. `matchMedia('(hover:hover) and (min-width:720px)')` && !reduced-motion 일 때만 활성
  - 읽기시간: `Math.max(1, Math.round(excerpt·없음 — posts에 words 없음))` → **PostMeta에 `minRead` 추가**: `lib/posts.ts` getAllPosts에서 content 단어수로 계산해 meta에 포함 (기존 본문 페이지 계산식과 동일: words/200)
- [ ] `lib/posts.test.ts`에 minRead 테스트 추가:

```ts
it("minRead는 1 이상", () => {
  for (const p of getAllPosts()) expect(p.minRead).toBeGreaterThanOrEqual(1);
});
```

- [ ] `npx vitest run` PASS, 홈 화면 Playwright 스팟체크(hover 프리뷰 등장)
- [ ] Commit: `feat: 홈 quiet craft — 태그필터·연도 리스트·호버 프리뷰`

### Task 4: /blog 통합 + 내부 링크 정리

**Files:** `app/blog/page.tsx`(교체), 검색 결과·breadcrumb 등 `/blog` 링크 참조처

- [ ] `app/blog/page.tsx` → `import { redirect } from "next/navigation"; export default function BlogIndex(){ redirect("/"); }` (기존 metadata 제거)
- [ ] `grep -rn '"/blog"' app components` 로 목록 링크 참조를 `/`로 정리 (글 상세 `/blog/[slug]`는 유지)
- [ ] sitemap.ts에서 /blog 엔트리 제거 확인
- [ ] Commit: `feat: /blog 목록을 홈으로 통합`

### Task 5: 본문 페이지 재스킨 + TOC

**Files:** `app/blog/[slug]/page.tsx`(재스킨), 신규 `components/post/Toc.tsx`·`ReadingHairline.tsx`, `app/globals.css`(prose 스타일), 삭제 `components/ReadingProgress.tsx`

- [ ] 유지: generateStaticParams/decodeSlug/generateMetadata/JSON-LD 2종/prev·next/related/Comments 위치(관련 글 위)
- [ ] 재스킨: breadcrumb 대신 `← 글` 단일 링크(draw-underline), 헤더 좌정렬 큰 타이포, 태그는 pill(홈과 동일 문법), 본문 prose 스타일(680px, 줄간 1.8, 코드블록 rehype-pretty-code 유지)
- [ ] Toc(클라): 본문 h2/h3를 `querySelectorAll`로 수집(MDX가 rehype-slug 없이 id 미부여라면 `rehype-slug` 추가), IntersectionObserver 스크롤스파이, `@media(min-width:1100px)`에서만 fixed 우측 표시
- [ ] ReadingHairline: 상단 2px, scroll 진행률 = accent
- [ ] 한글 slug 글(`회고` 등) 라우팅 스팟체크
- [ ] Commit: `feat: 본문 페이지 quiet craft + 목차 스크롤스파이`

### Task 6: 검색·about·댓글 재스킨

**Files:** `app/search/page.tsx`, `components/SearchBox.tsx`, `app/about/page.tsx`, `components/comments/*`, `components/Comments.tsx`

- [ ] 검색: 입력창을 라인형(보더 하단 1px, focus시 accent)으로, 결과 행은 홈 리스트와 동일 문법(행 밀림+화살표)
- [ ] about: 토큰·타이포 정렬 (구조 무변경)
- [ ] 댓글: 기존 inline style의 색만 새 토큰으로, 버튼 pill 문법 통일. 로직·액션 무변경
- [ ] Commit: `feat: 검색·소개·댓글 quiet craft 재스킨`

### Task 7: 로컬 에디터

**Files:** 신규 `app/editor/page.tsx`·`EditorShell.tsx`·`api/save/route.ts`·`api/image/route.ts`, `lib/editor.ts`(+test)

- [ ] `npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link tiptap-markdown`
- [ ] `lib/editor.ts` — 순수 함수 (TDD):

```ts
export function makeSlug(title: string): string           // 공백→하이픈, 특수문자 제거, 한글 유지
export function makeFrontmatter(meta: {title:string;date:string;excerpt:string;tags:string[];featured:boolean}): string
// gray-matter.stringify 사용, 기존 65편과 같은 키 순서
export function autoExcerpt(markdown: string): string      // 첫 문단 plain text 150자
```

- [ ] `lib/editor.test.ts` 먼저 작성 → FAIL 확인 → 구현 → PASS:

```ts
it("makeSlug: 한글 유지·공백 하이픈", () => expect(makeSlug("요즘 생각 (feat. AI)")).toBe("요즘-생각-feat-AI"));
it("frontmatter round-trip", () => { const md = makeFrontmatter(meta)+body; expect(matter(md).data.title).toBe(meta.title); });
```

- [ ] `api/save/route.ts` — POST {slug, frontmatter, markdown}. **가드 2중**: `process.env.NODE_ENV !== "development"` → 404, slug에 `/`·`..` 포함 → 400. `content/posts/<slug>.mdx`로 write(이미 존재하면 409)
- [ ] `api/image/route.ts` — POST FormData{file, slug} → `public/images/<slug>/<timestamp>-<name>` 저장, `{url}` 응답. 동일 가드 + MIME image/* 검사
- [ ] `page.tsx` — `if (process.env.NODE_ENV !== "development") notFound();` + EditorShell
- [ ] EditorShell(클라): 좌 Tiptap(StarterKit+Image+Link, tiptap-markdown), 우 미리보기(마크다운→HTML은 tiptap-markdown getMarkdown() 결과를 상태로, 미리보기는 본문 prose 클래스 적용 div에 marked 대신 **Tiptap 자체 렌더를 그대로 보이게** — 별도 파서 불요). 상단 폼: 제목→slug 미리보기, 태그(기존 태그 클릭+직접 입력), excerpt(자동+수정), featured 체크. 붙여넣기 이미지: `editorProps.handlePaste`에서 File 감지→ api/image POST→ 에디터에 image 노드 삽입. 30초마다 localStorage 임시저장 + 복원
- [ ] dev 서버에서: 글 작성→저장→`content/posts/`에 파일 생성→홈 리스트에 뜨는지 확인 → 테스트 파일 삭제
- [ ] `npm run build` 후 `.next` 라우트 매니페스트에서 /editor가 prod 페이지로 노출되어도 404 동작 확인 (가드 검증)
- [ ] Commit: `feat: dev 전용 WYSIWYG 에디터 — Tiptap·이미지 붙여넣기·mdx 저장`

### Task 8: 전체 검증

- [ ] `npx vitest run` 전체 PASS
- [ ] `npm run lint` + `npm run build` 클린 (65편 SSG 성공)
- [ ] Playwright: ①홈 라이트/다크 ②호버 프리뷰 ③태그 필터 ④본문(목차·진행바·코드블록) ⑤모바일 375px ⑥검색 ⑦에디터 저장 흐름 — 스크린샷 판정
- [ ] 회귀: RSS(`/feed.xml`)·sitemap 응답 확인
- [ ] Commit + (사용자 확인 후) PR
