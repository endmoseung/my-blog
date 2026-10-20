"use client";
import dynamic from "next/dynamic";
import type { EditorInitial } from "../EditorShell";

// 편집기는 브라우저 전용으로 그린다 — 임시저장본(localStorage)을 첫 렌더에서 읽어도
// 서버 HTML과 어긋나지 않고, CodeMirror도 DOM이 있어야 만들어진다.
const EditorShell = dynamic(() => import("../EditorShell"), {
  ssr: false,
  loading: () => <p style={{ color: "var(--dim)", fontSize: 14 }}>편집기를 불러오는 중…</p>,
});

export default function EditorLoader(props: { knownTags: string[]; initial?: EditorInitial }) {
  return <EditorShell {...props} />;
}
