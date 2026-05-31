"use client";
import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

export default function Comments() {
  const { theme } = useTheme();
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  if (!repo) {
    return (
      <div
        style={{
          marginTop: 56,
          borderTop: "1px solid var(--line)",
          paddingTop: 32,
          color: "var(--muted)",
          fontSize: ".9rem",
        }}
      >
        💬 댓글은 Giscus 설정 후 활성화돼. (GitHub repo·Discussions·giscus.app ID 필요)
      </div>
    );
  }
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
