import type { MDXComponents } from "mdx/types";
import ColorPlayground from "./ColorPlayground";

export const mdxComponents: MDXComponents = {
  ColorPlayground,
  h2: (p) => (
    <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginTop: 40, marginBottom: 10, letterSpacing: "-0.02em" }} {...p} />
  ),
  h3: (p) => <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginTop: 28, marginBottom: 8 }} {...p} />,
  a: (p) => <a style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }} {...p} />,
  p: (p) => <p style={{ margin: "18px 0", lineHeight: 1.9, fontSize: "1.12rem", color: "var(--fg)" }} {...p} />,
  ul: (p) => <ul style={{ margin: "18px 0", paddingLeft: 22, lineHeight: 1.9, fontSize: "1.12rem", listStyle: "disc" }} {...p} />,
  ol: (p) => <ol style={{ margin: "18px 0", paddingLeft: 22, lineHeight: 1.9, fontSize: "1.12rem", listStyle: "decimal" }} {...p} />,
  li: (p) => <li style={{ margin: "4px 0" }} {...p} />,
  blockquote: (p) => (
    <blockquote
      style={{
        borderLeft: "3px solid var(--accent)",
        paddingLeft: 16,
        margin: "20px 0",
        color: "var(--muted)",
        fontStyle: "italic",
      }}
      {...p}
    />
  ),
};
