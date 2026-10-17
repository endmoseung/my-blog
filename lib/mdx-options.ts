// 블로그 글 화면과 편집기 미리보기가 함께 쓰는 MDX 변환 설정.
// 한 곳에만 두어야 미리보기가 실제 글과 다르게 보이는 일이 없다.
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import type { serialize } from "next-mdx-remote/serialize";

type MdxOptions = NonNullable<NonNullable<Parameters<typeof serialize>[1]>["mdxOptions"]>;

export const blogMdxOptions: MdxOptions = {
  // defaultLang: 언어 없는 ```블록도 shiki가 plaintext로 색을 입히게 (없으면 스킵돼 무색)
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark", defaultLang: "plaintext" }]],
};
