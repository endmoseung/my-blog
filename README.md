# 내 블로그

쾌활·컬러풀 톤의 개인 블로그. Next.js + MDX + Giscus 댓글.

## 기능

- 🎨 **인터랙티브 히어로** — 마우스 따라 모이는 컬러 도형 캔버스
- ✍️ **MDX 글** — 글 안에 React 인터랙티브 위젯 삽입 가능
- 💬 **Giscus 댓글** — GitHub Discussions 기반 (무료, DB 불필요)
- 🌗 **다크/라이트 테마** — 토글 + 시스템 연동, Giscus 테마 동기화
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

## 💬 Giscus 댓글 켜기 (한 번만 설정)

댓글은 GitHub Discussions를 백엔드로 쓴다. 아래 순서로 설정하면 활성화된다.

1. **GitHub에 public repo 생성** (예: `내아이디/my-blog`)
2. repo **Settings → General → Features → Discussions 체크**
3. https://giscus.app/ko 접속 → 위 repo 입력 → 아래 값 발급:
   - 매핑: **pathname** 선택 (코드에 이미 맞춰둠)
   - 페이지 하단에 생성된 `data-repo-id`, `data-category-id` 복사
4. 프로젝트 루트에 **`.env.local`** 파일 생성:

```
NEXT_PUBLIC_GISCUS_REPO=내아이디/my-blog
NEXT_PUBLIC_GISCUS_REPO_ID=발급받은_repoId
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=발급받은_categoryId
```

5. `npm run dev` 재시작 → 글 하단에 댓글창이 뜬다. (값이 없으면 "Giscus 설정 후 활성화" 안내만 표시)

> `.env.local` 은 git에 안 올라간다(.gitignore). Vercel 배포 시엔 대시보드 환경변수에 같은 값을 넣으면 된다.

## 배포 (Vercel)

```bash
gh repo create my-blog --public --source=. --push
```

그 다음 https://vercel.com 에서 repo import → 환경변수(`NEXT_PUBLIC_GISCUS_*`) 입력 → Deploy.

## 커스터마이즈

- **컬러 톤** — `app/globals.css` 의 `:root` / `[data-theme="dark"]` 변수
- **소개 페이지** — `app/about/page.tsx` 의 `○○` 와 GitHub 링크를 본인 것으로
- **사이트 제목** — `app/layout.tsx` 의 `metadata`, `components/Nav.tsx`
