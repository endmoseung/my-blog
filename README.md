# 내 블로그

쾌활·컬러풀 톤의 개인 블로그. Next.js + MDX + Giscus 댓글.

## 기능

- 🎨 **인터랙티브 히어로** — 마우스 따라 모이는 컬러 도형 캔버스
- ✍️ **MDX 글** — 글 안에 React 인터랙티브 위젯 삽입 가능
- 💬 **자체 댓글 (Supabase)** — 로그인 없이 **누구나** 댓글. 대댓글·이모지 리액션·관리자 삭제·스팸 방어
- 🌗 **다크/라이트 테마** — 토글 + 시스템 연동
- 🏷️ **태그 필터 + Featured 카드** — 매거진형 글 목록
- 📊 **읽기 진행바, fade-in 등장, 코드 하이라이트**
- ♿ **`prefers-reduced-motion` 존중**, 모바일 반응형

## 개발

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # 린트
npx vitest run   # 테스트
```

## 글 쓰기

`content/posts/*.mdx` 에 파일을 추가하면 자동으로 글이 생긴다. frontmatter 형식:

```mdx
---
title: "글 제목"
date: "2026-06-01"
excerpt: "목록에 보일 한 줄 요약."
tags: ["태그1", "태그2"]
featured: false   # true면 목록에서 크게 강조
---

본문은 마크다운. 글 안에 인터랙티브 위젯도 넣을 수 있다:

<ColorPlayground />
```

새 위젯은 `components/mdx/` 에 만들고 `components/mdx/MDXComponents.tsx` 에 등록하면 글에서 쓸 수 있다.

## 💬 댓글 켜기 (Supabase — 한 번만 설정)

댓글은 **로그인 없이 누구나** 달 수 있는 자체 시스템이다. Supabase(무료 Postgres)를 백엔드로 쓴다.

### 1. Supabase 프로젝트 만들기
1. https://supabase.com 가입 → **New project** 생성 (무료 티어로 충분)
2. 프로젝트 대시보드 → **Settings → API** 에서 아래 값 확인:
   - `Project URL`
   - `anon public` 키
   - `service_role` 키 (관리자 삭제용, **비밀**)

### 2. 테이블·정책 만들기
1. 대시보드 → **SQL Editor → New query**
2. 이 저장소의 **`supabase/schema.sql`** 내용을 통째로 붙여넣고 **Run**
3. comments·comment_reactions 테이블 + RLS 정책 + 집계 뷰가 생성된다

### 3. 환경변수 넣기
프로젝트 루트에 **`.env.local`** 생성:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...(anon public 키)
SUPABASE_SERVICE_ROLE_KEY=eyJ...(service_role 키, 비밀)
ADMIN_TOKEN=내가-정한-아무-비밀-문자열   # 관리자 삭제 호출 보호용
IP_HASH_SALT=아무-랜덤-문자열            # IP 해시 솔트(스팸 추적용)
```

4. `npm run dev` 재시작 → 글 하단에 댓글창이 뜬다. (값이 없으면 "Supabase 연결 후 활성화" 안내만 표시)

> `.env.local`·`service_role`·`ADMIN_TOKEN` 은 절대 git/클라이언트에 노출하면 안 된다. `.env.local` 은 이미 .gitignore에 있다. Vercel 배포 시엔 대시보드 환경변수에 같은 값을 넣는다.

### 스팸·악용 방어 (기본 탑재)
- **honeypot** 숨김 필드 — 봇 자동 차단
- **rate limit** — 같은 IP가 1분에 3개 이상 차단 (IP는 해시로만 저장, 원문 미보관)
- **RLS** — 공개는 읽기/쓰기만, 삭제·숨김은 `service_role`(관리자)만
- **관리자 삭제/숨김** — `hideComment(id, ADMIN_TOKEN, slug)` 서버 액션으로 호출

### 댓글 기능
- 로그인 없이 이름만으로 작성 (이름별 컬러 아바타 자동)
- **대댓글**(최대 3단 들여쓰기) · **이모지 리액션** ❤️👍😂🎉🤔
- 상대 시간 표시("3분 전")

## 배포 (Vercel)

```bash
gh repo create my-blog --public --source=. --push
```

그 다음 https://vercel.com 에서 repo import → 환경변수(`NEXT_PUBLIC_GISCUS_*`) 입력 → Deploy.

## 커스터마이즈

- **컬러 톤** — `app/globals.css` 의 `:root` / `[data-theme="dark"]` 변수
- **소개 페이지** — `app/about/page.tsx` 의 `○○` 와 GitHub 링크를 본인 것으로
- **사이트 제목** — `app/layout.tsx` 의 `metadata`, `components/Nav.tsx`
