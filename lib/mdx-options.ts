// 블로그 글 화면과 편집기 미리보기가 함께 쓰는 MDX 변환 설정.
// 한 곳에만 두어야 미리보기가 실제 글과 다르게 보이는 일이 없다.
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { serialize } from "next-mdx-remote/serialize";

type MdxOptions = NonNullable<NonNullable<Parameters<typeof serialize>[1]>["mdxOptions"]>;

export const blogMdxOptions: MdxOptions = {
  remarkPlugins: [
    // 취소선·표·맨 주소 자동 링크. singleTilde를 끄지 않으면 「90~97」 같은 범위 표기가 취소선이 된다.
    [remarkGfm, { singleTilde: false }],
    // 엔터 한 번 = 줄바꿈. 글 64편이 모두 이 규칙(velog)으로 쓰였다.
    remarkBreaks,
  ],
  // defaultLang: 언어 없는 ```블록도 shiki가 plaintext로 색을 입히게 (없으면 스킵돼 무색)
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark", defaultLang: "plaintext" }]],
};
