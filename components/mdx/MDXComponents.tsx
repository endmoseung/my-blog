import type { MDXComponents } from "mdx/types";
import ColorPlayground from "./ColorPlayground";

// 타이포그래피는 globals.css의 .prose가 담당 — 여기엔 MDX 안에서 쓰는
// 인터랙티브 위젯 매핑만 남긴다.
export const mdxComponents: MDXComponents = {
  ColorPlayground,
};
