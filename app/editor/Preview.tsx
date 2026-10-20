"use client";
import { Component, memo, useEffect, useRef, useState, type ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import * as devRuntime from "react/jsx-dev-runtime";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/components/mdx/MDXComponents";

// 한글 조합처럼 몰아서 오는 변경을 한 요청으로 묶는 짧은 틈. 길게 잡으면 그만큼 미리보기가 늦다.
const SETTLE_MS = 30;

type PreviewResponse = { compiled: MDXRemoteSerializeResult } | { error: string };

function isPreviewResponse(v: unknown): v is PreviewResponse {
  if (typeof v !== "object" || v === null) return false;
  return ("compiled" in v && typeof v.compiled === "object") || ("error" in v && typeof v.error === "string");
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// 변환 요청 줄 세우기 — 요청은 한 번에 하나만 보내고, 그사이 바뀐 내용은 가장 최신 것 하나만 이어서 보낸다.
// 키마다 기다림을 새로 거는 디바운스는 타이핑하는 내내 미리보기를 멈춰 세웠다.
function createCompileQueue(onResult: (r: PreviewResponse) => void) {
  let latest: string | null = null;
  let busy = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ctrl = new AbortController();

  const run = async () => {
    timer = undefined;
    if (busy || latest === null) return;
    const markdown = latest;
    latest = null;
    busy = true;
    try {
      const res = await fetch("/editor/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
        signal: ctrl.signal,
      });
      const data: unknown = await res.json();
      if (!disposed && isPreviewResponse(data)) onResult(data);
    } catch (e) {
      if (!disposed) onResult({ error: message(e) });
    } finally {
      busy = false;
      if (!disposed && latest !== null) run();
    }
  };

  return {
    request(markdown: string) {
      latest = markdown;
      if (!busy && timer === undefined) timer = setTimeout(run, SETTLE_MS);
    },
    dispose() {
      disposed = true;
      clearTimeout(timer);
      ctrl.abort();
    },
  };
}

type MdxContent = (props: Record<string, never>) => ReactNode;

function isMdxModule(v: unknown): v is { default: MdxContent } {
  return typeof v === "object" && v !== null && "default" in v && typeof v.default === "function";
}

// 컴파일된 본문을 실행해 「본문 그리기 함수」를 얻는다(next-mdx-remote의 MDXRemote와 같은 방식).
// 컴포넌트 맵은 훅 대신 고정 값으로 건네, 아래 MdxBody가 이 함수를 그냥 불러도 되게 한다.
const scope = { ...runtime, ...devRuntime, useMDXComponents: () => mdxComponents };
function hydrate(compiledSource: string): MdxContent {
  const mod: unknown = new Function(compiledSource)(scope);
  if (!isMdxModule(mod)) throw new Error("변환 결과를 읽지 못했어요.");
  return mod.default;
}

// 본문 그리기 함수를 컴포넌트로 쓰지 않고 그냥 부른다. 컴파일마다 함수가 새로 생기니
// 컴포넌트로 쓰면 React가 매번 본문 전체를 지우고 새로 만든다(이미지도 다시 그림).
// 이렇게 부르면 바뀐 부분만 고친다. memo라 키 입력만으로는 다시 그리지 않는다.
const MdxBody = memo(function MdxBody({ content }: { content: MdxContent }) {
  return <>{content({})}</>;
});

// 컴파일은 됐지만 그리다가 터지는 경우(정의 안 된 MDX 컴포넌트 등) 편집기 전체가 죽지 않게 막는다.
// 다음 컴파일 결과가 오면 오류 상태를 비우고 다시 그린다.
type BoundaryProps = { content: MdxContent; onError(message: string): void; children: ReactNode };
class RenderBoundary extends Component<BoundaryProps, { content: MdxContent; message: string | null }> {
  state = { content: this.props.content, message: null as string | null };
  static getDerivedStateFromProps(props: BoundaryProps, state: { content: MdxContent }) {
    return props.content === state.content ? null : { content: props.content, message: null };
  }
  static getDerivedStateFromError(e: unknown) {
    return { message: message(e) };
  }
  componentDidCatch(e: unknown) {
    this.props.onError(message(e));
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
  const [content, setContent] = useState<MdxContent | null>(null);
  // 변환 오류는 직전에 성공한 화면 위에 띄우고, 그리기 오류는 본문 자리에 띄운다. 둘 다 출간 창에서도 경고한다.
  const [compileError, setCompileError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const queue = useRef<ReturnType<typeof createCompileQueue> | null>(null);

  // 출간 창에서도 오류를 경고하도록 부모에 알린다. 최신 콜백은 ref로 읽는다.
  const notify = useRef(onErrorChange);
  useEffect(() => {
    notify.current = onErrorChange;
  });
  const shownError = compileError ?? renderError;
  useEffect(() => {
    notify.current(shownError);
  }, [shownError]);

  useEffect(() => {
    const q = createCompileQueue((data) => {
      if ("error" in data) {
        setCompileError(data.error);
        return;
      }
      let next: MdxContent;
      try {
        next = hydrate(data.compiled.compiledSource);
      } catch (e) {
        setCompileError(message(e));
        return;
      }
      // 함수를 상태로 넣으려면 「이전 값 → 새 값」 형태로 감싸야 한다.
      setContent(() => next);
      setCompileError(null);
      setRenderError(null);
    });
    queue.current = q;
    return () => {
      q.dispose();
      queue.current = null;
    };
  }, []);

  useEffect(() => {
    queue.current?.request(markdown);
  }, [markdown]);

  return (
    <article className="ved-article">
      {compileError && (
        // 전역 pre 규칙(어두운 코드 배경 !important)을 피하려고 div로 그린다.
        <div className="ved-error" role="alert">
          {"MDX 변환 오류 — 이대로 출간하면 글 화면이 깨져요.\n\n" + compileError}
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
        {content && (
          <RenderBoundary content={content} onError={setRenderError}>
            <MdxBody content={content} />
          </RenderBoundary>
        )}
      </div>
    </article>
  );
}
