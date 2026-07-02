# Quiet Craft 리디자인 + 로컬 에디터 — 설계 스펙

**Status:** 승인됨 (2026-07-02, 비주얼 컴패니언 데모로 방향 확정)
**Supersedes:** `docs/superpowers/plans/2026-06-01-personal-blog.md`의 비주얼 정체성(쾌활·컬러풀·인터랙티브 히어로). 콘텐츠 파이프라인·댓글·SEO 등 인프라 설계는 계승한다.

## Goal

md 소스(`content/posts/*.mdx` 65편)는 그대로 두고, 화면 층만 **quiet craft** 결로 갈아끼운다: 여백+타이포 중심의 심플한 바탕에, 만지는 곳마다 조용하게 반응하는 마이크로 인터랙션. 추가로 글쓰기 진입장벽(마크다운 문법, 이미지 삽입)을 없애는 **로컬 전용 WYSIWYG 에디터**를 만든다.

승인된 룩 데모: `.superpowers/brainstorm/18025-1783000447/content/quiet-demo.html` (이 파일이 비주얼 SSOT — 토큰·간격·이징의 출발점)

## 표절 회피 원칙 — 같을 것 / 다를 것

| | 항목 | 근거 |
|---|---|---|
| ✅ 같아도 됨 (보편 문법) | 좁은 한 컬럼, 연도별 글 리스트, draw-underline 링크, 다크 토글, 태그 필터, 목차 스크롤스파이 | rauno.me·paco.me 고유가 아닌 업계 공통 패턴 |
| ❌ 달라야 함 | 각 사이트의 정확한 카피·레이아웃 비율·팔레트 값·폰트 조합을 그대로 옮기기 | 그건 그들의 정체성 |
| 🎨 우리 것 | 한국어 보이스 + Pretendard, 파랑 포인트 1색, **호버 프리뷰 카드에 "발췌+읽기시간"**(이미지 아닌 텍스트 프리뷰), 롤링 단어 히어로 카피, 서울 시계 | 같은 문법 + 우리 콘텐츠의 얼굴 |

레퍼런스 출처: rauno.me(철학), paco.me(리스트 구조), emilkowal.ski(이징 감각), antfu.me(원형 테마 전환), dennissnellenberg.com(커서 추적 프리뷰의 텍스트 변형).

## 유지 / 교체 / 신규

```
my-blog (기존 레포, feat/quiet-craft 브랜치)
│
├── 유지 (검증된 플러밍 — 손대지 않음)
│   ├─ content/posts/*.mdx           65편 + frontmatter 스키마 무변경
│   ├─ lib/ posts·search·comments·json-ld·site
│   ├─ app/actions/comments.ts       Supabase 댓글 (스팸 방어 포함)
│   ├─ app/feed.xml·sitemap·robots·OG 이미지·한글 slug 처리
│   └─ Vercel 배포 설정
│
├── 교체 (화면 층 = quiet craft)
│   ├─ app/globals.css               새 토큰 (아래 §디자인 토큰)
│   ├─ app/page.tsx                  홈 = 헤더+히어로+태그필터+연도별 리스트+푸터
│   ├─ app/blog/page.tsx             홈으로 redirect (홈이 곧 글 목록)
│   ├─ app/blog/[slug]/page.tsx      본문 리디자인 (구조 유지, 스킨 교체)
│   ├─ app/search·about              같은 톤 재스킨
│   └─ components/*                  새 인터랙션 유닛으로 재작성
│
└── 신규
    └─ app/editor/                   로컬 전용 에디터 (§에디터)
```

## 디자인 토큰

```css
:root                { --bg:#fdfdfc; --fg:#161616; --dim:#8a8a86; --line:#ececea; --soft:#f4f4f2; --accent:#0f62fe; }
[data-theme="dark"]  { --bg:#111113; --fg:#ededea; --dim:#82827e; --line:#232326; --soft:#1a1a1d; --accent:#7aa2ff; }
```

- 폰트: Pretendard Variable(로컬 woff2 유지). 가변 굵기를 인터랙션에 사용.
- 본문 measure: 640px(리스트)·680px(본문). 포인트색은 accent 1색만.
- 다크모드: next-themes의 기존 `data-theme` 전략 유지 (구현 시 class 전략에서 선회 — 변경 범위 최소화).

## 인터랙션 유닛 (전부 `prefers-reduced-motion` 존중)

| 유닛 | 동작 | 구현 노트 |
|---|---|---|
| 호버 프리뷰 카드 | 글 행 hover → 발췌+태그+읽기시간 카드가 커서를 lerp(0.14)로 따라옴 | 클라 컴포넌트. rAF 1개. 모바일(<720px)·reduced-motion 비활성 |
| 원형 테마 전환 | 토글 클릭 지점에서 circle clip으로 번짐 | View Transitions API, 미지원 시 0.45s 페이드 폴백 |
| 롤링 단어 | 히어로 "만들고→기록하고→공유하고" 순환 | CSS keyframes only |
| draw-underline | 링크 hover 시 왼→오 밑줄 | CSS only |
| 태그 pill | hover 시 아래서 차오르는 채움, 클릭 시 실제 필터링 | 기존 TagFilter 로직 재사용 |
| 행 밀림+화살표 | 행 hover 시 제목 10px 이동, accent 화살표 등장 | CSS only |
| 스크롤 헤어라인 | 상단 2px 진행바 (기존 ReadingProgress 재해석) | 본문 페이지에선 읽기 진행률 |
| 서울 시계 | 푸터 실시간 HH:MM:SS | 클라 컴포넌트 |
| 이름 점 바운스 · 👋 흔들기 | hover 스프링 | CSS only |

## 페이지 설계

**홈 (`/`)** — 헤더(이름., 글/소개/RSS, 테마 토글) → 히어로(인사+롤링 단어+소개 2줄) → 태그 pill(전체+상위 태그, 클릭 필터) → featured 글(리스트 최상단 구분 스타일) → 연도별 글 리스트(행=제목+날짜, 호버 프리뷰) → 푸터(© + 서울 시계). `/blog`는 `/`로 permanent redirect.

**본문 (`/blog/[slug]`)** — 680px 한 컬럼. 뒤로가기 링크 → 제목(큰 타이포)+날짜+태그+읽기시간 → 본문(기존 MDX 파이프라인·rehype-pretty-code 유지, 타이포 스타일만 교체) → 이전/다음 글 → 댓글(WIP에서 옮긴 위치 유지: 관련 글보다 위) → 관련 글. 데스크톱 1100px+에서 우측 미니 목차(h2/h3 스크롤스파이, 현재 섹션 accent). 상단 헤어라인 = 읽기 진행률.

**검색 (`/search`)** — 기존 검색 로직 유지, 입력창·결과 리스트를 홈 리스트와 같은 문법으로 재스킨.

**소개 (`/about`)** — 같은 토큰·타이포로 재스킨. 구조 변경 없음.

**댓글** — 로직·서버 액션 무변경. 스킨만: 인풋 라인화, 버튼 pill, 이모지 리액션은 유지하되 채도 낮춤. WIP 커밋(0046953)의 문구 존댓말화 유지.

## 에디터 (`/editor`, 로컬 전용)

**프로덕션 차단이 안전선**: 페이지 컴포넌트에서 `process.env.NODE_ENV !== 'development'`이면 `notFound()`. 파일 쓰기 API(route handler)도 동일 가드 + localhost 확인. 배포엔 링크도 노출하지 않는다.

```
┌─ /editor ─────────────────────────────────────────────┐
│ 제목 입력 → slug(한글 유지)·date 자동                    │
│ 태그: 기존 65편 태그 목록에서 클릭 + 새 태그 입력          │
│ excerpt: 본문 첫 문단에서 자동 생성, 수정 가능             │
│ featured 토글                                           │
│ ┌──────────────┐  ┌──────────────┐                     │
│ │ Tiptap        │  │ 실시간 미리보기 │                     │
│ │ WYSIWYG       │→ │ 본문 페이지와   │                     │
│ │ +마크다운 단축키│  │ 동일 스타일    │                     │
│ │ +이미지 붙여넣기│  │              │                     │
│ └──────────────┘  └──────────────┘                     │
│ [임시저장(localStorage)] [파일로 저장]                    │
└────────────────────────────────────────────────────────┘
          │
          ├─ POST /editor/api/save  → content/posts/<slug>.mdx
          │    (gray-matter로 frontmatter 직렬화, 기존 스키마 그대로)
          └─ POST /editor/api/image → public/images/<slug>/<name>
               응답 경로로 에디터에 이미지 노드 삽입
```

- **Tiptap** (`@tiptap/react` + StarterKit + Image + Link + CodeBlock) + **tiptap-markdown**으로 마크다운 직렬화. 결과물은 지금과 동일한 `.mdx` — 파이프라인 무변경.
- 기존 글 편집은 v1 스코프 아웃(새 글 작성만). 발행(git commit/push)도 에디터 밖.
- MDX 인라인 위젯 삽입은 v1 스코프 아웃 — 저장 후 파일에서 직접.

## 검증

- 기존 vitest(`lib/posts.test.ts`, `lib/search.test.ts`) 통과 유지 + 에디터 직렬화(frontmatter round-trip) 테스트 추가
- `npm run build` + `npm run lint` 클린
- Playwright로 실기동 화면 검증: 라이트/다크, 호버 프리뷰, 테마 전환, 모바일 뷰포트, 본문 목차, 에디터 저장 흐름
- 65편 전편 빌드 성공 + 한글 slug 라우팅 스팟체크

## 제약

- **Next.js 16**: 코드 작성 전 `node_modules/next/dist/docs/` 관련 가이드 필독 (레포 AGENTS.md 규칙)
- RSC 경계: 인터랙션 유닛만 클라 컴포넌트로, 리스트·본문은 서버 컴포넌트 유지
- 접근성: 키보드 포커스 링, reduced-motion, 대비 AA는 기존 수준 유지
