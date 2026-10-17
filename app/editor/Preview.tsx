"use client";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/components/mdx/MDXComponents";

const DEBOUNCE_MS = 250;

type PreviewResponse = { compiled: MDXRemoteSerializeResult } | { error: string };

function isPreviewResponse(v: unknown): v is PreviewResponse {
  if (typeof v !== "object" || v === null) return false;
  return ("compiled" in v && typeof v.compiled === "object") || ("error" in v && typeof v.error === "string");
}

// 컴파일은 됐지만 그리다가 터지는 경우(정의 안 된 MDX 컴포넌트 등) 편집기 전체가 죽지 않게 막는다.
// key를 컴파일 결과로 주어, 다음 컴파일이 오면 오류 상태를 비운다.
class RenderBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { message: e instanceof Error ? e.message : String(e) };
  }
  render() {
    if (this.state.message) return <p className="ved-error">미리보기를 그리지 못했어요: {this.state.message}</p>;
    return this.props.children;
  }
}

// 실제 글 화면(app/blog/[slug]/page.tsx)과 같은 머리말 + .prose 본문으로 그린다.
// 변환은 서버(/editor/api/preview)가 블로그와 같은 설정으로 한다.
type Props = { title: string; tags: string[]; markdown: string; onErrorChange(error: string | null): void };

export default function Preview({ title, tags, markdown, onErrorChange }: Props) {
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 출간 창에서도 오류를 경고하도록 부모에 알린다. 최신 콜백은 ref로 읽는다.
  const notify = useRef(onErrorChange);
  useEffect(() => {
    notify.current = onErrorChange;
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/editor/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
          signal: ctrl.signal,
        });
        const data: unknown = await res.json();
        if (ctrl.signal.aborted || !isPreviewResponse(data)) return;
        if ("compiled" in data) {
          setCompiled(data.compiled);
          setError(null);
          notify.current(null);
        } else {
          // 오류가 나도 직전에 성공한 화면은 남겨 두고, 위에 오류만 띄운다.
          setError(data.error);
          notify.current(data.error);
        }
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        notify.current(message);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [markdown]);

  return (
    <article className="ved-article">
      {error && (
        // 전역 pre 규칙(어두운 코드 배경 !important)을 피하려고 div로 그린다.
        <div className="ved-error" role="alert">
          {"MDX 변환 오류 — 이대로 출간하면 글 화면이 깨져요.\n\n" + error}
        </div>
      )}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(1.7rem, 3.2vw, 2.3rem)", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {title || <span style={{ color: "var(--dim)" }}>제목</span>}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
            {tags.map((t) => (
              <span key={t} className="tag" style={{ cursor: "default" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose">
        {compiled && (
          <RenderBoundary key={compiled.compiledSource}>
            <MDXRemote {...compiled} components={mdxComponents} />
          </RenderBoundary>
        )}
      </div>
    </article>
  );
}
