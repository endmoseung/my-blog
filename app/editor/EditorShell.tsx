"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { makeSlug, autoExcerpt, type DraftMeta } from "@/lib/editor";

const DRAFT_KEY = "editor_draft_v1";
const AUTOSAVE_MS = 30_000;

type Draft = { title: string; tags: string[]; excerpt: string; featured: boolean; markdown: string };

export default function EditorShell({ knownTags }: { knownTags: string[] }) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptTouched, setExcerptTouched] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const slug = makeSlug(title);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  // 이미지 붙여넣기 — 파일이면 업로드 후 이미지 노드로 삽입
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slugRef.current || "draft");
    const res = await fetch("/editor/api/image", { method: "POST", body: fd });
    if (!res.ok) return null;
    const { url } = (await res.json()) as { url: string };
    return url;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit v3에 Link 포함 — 별도 등록하면 duplicate 경고
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    editorProps: {
      attributes: { class: "prose editor-body", "aria-label": "본문" },
      handlePaste: (view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        for (const f of files) {
          uploadImage(f).then((url) => {
            if (url) {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              view.dispatch(view.state.tr.replaceSelectionWith(node));
            } else {
              setStatus("이미지 업로드에 실패했어요.");
            }
          });
        }
        return true;
      },
    },
  });

  // tiptap-markdown이 editor.storage에 markdown을 심지만 타입 선언은 없다 —
  // 구조적 타입으로 좁혀 접근(§type-safety: as any 금지).
  const getMarkdown = useCallback(() => {
    const storage = editor?.storage as { markdown?: { getMarkdown(): string } } | undefined;
    return storage?.markdown?.getMarkdown() ?? "";
  }, [editor]);

  // 임시저장(localStorage) — 30초마다 + 복원은 마운트 때 한 번
  useEffect(() => {
    if (!editor) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw) as Draft;
        if (d.title || d.markdown) {
          setTitle(d.title);
          setTags(d.tags ?? []);
          setExcerpt(d.excerpt ?? "");
          setFeatured(d.featured ?? false);
          editor.commands.setContent(d.markdown ?? "");
          setStatus("임시저장본을 복원했어요.");
        }
      } catch {
        /* 깨진 초안은 무시 */
      }
    }
  }, [editor]);

  useEffect(() => {
    const id = setInterval(() => {
      const draft: Draft = { title, tags, excerpt, featured, markdown: getMarkdown() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [title, tags, excerpt, featured, getMarkdown]);

  const addTag = (t: string) => {
    const clean = t.trim();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  };

  const save = async () => {
    const markdown = getMarkdown();
    const meta: DraftMeta = {
      title: title.trim(),
      date: new Date().toISOString().slice(0, 10),
      excerpt: excerptTouched && excerpt.trim() ? excerpt.trim() : autoExcerpt(markdown),
      tags,
      featured,
    };
    setStatus("저장 중…");
    const res = await fetch("/editor/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta, markdown }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.removeItem(DRAFT_KEY);
      setSavedPath(data.path);
      setStatus(null);
    } else {
      setStatus(data.error ?? "저장에 실패했어요.");
    }
  };

  if (savedPath) {
    return (
      <div style={{ padding: "60px 0" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>저장 완료 ✓</h1>
        <p style={{ color: "var(--dim)", marginTop: 12, fontSize: 14.5 }}>
          <code>{savedPath}</code> 에 저장됐어요. 커밋·푸시는 직접 해주세요.
        </p>
        <p style={{ marginTop: 24, display: "flex", gap: 18 }}>
          <a href={`/blog/${slug}`} className="u" style={{ fontWeight: 650, fontSize: 14.5 }}>
            글 보러 가기 →
          </a>
          <button
            onClick={() => location.reload()}
            className="u"
            style={{ fontWeight: 650, fontSize: 14.5, background: "none", border: 0, cursor: "pointer", color: "var(--dim)" }}
          >
            새 글 쓰기
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--dim)", letterSpacing: ".08em", marginBottom: 26 }}>
        LOCAL EDITOR — 이 페이지는 dev에서만 존재해요 · 30초마다 자동 임시저장
      </p>

      {/* 제목 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하면 나머지는 알아서"
        aria-label="제목"
        style={{
          width: "100%",
          fontSize: "clamp(1.6rem, 4vw, 2.1rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--fg)",
          fontFamily: "inherit",
        }}
      />
      <p style={{ fontSize: 12, color: "var(--dim)", margin: "8px 0 18px", fontVariantNumeric: "tabular-nums" }}>
        content/posts/{slug || "…"}.mdx · {new Date().toISOString().slice(0, 10)}
      </p>

      {/* 태그 */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
        {tags.map((t) => (
          <button key={t} className="tag on" onClick={() => setTags(tags.filter((x) => x !== t))} title="빼기">
            {t} ×
          </button>
        ))}
        {knownTags
          .filter((t) => !tags.includes(t))
          .slice(0, 10)
          .map((t) => (
            <button key={t} className="tag" onClick={() => addTag(t)}>
              {t}
            </button>
          ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="+ 새 태그"
          aria-label="새 태그"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--fg)",
            fontSize: 12.5,
            width: 90,
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* featured */}
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--dim)", marginBottom: 22, cursor: "pointer" }}>
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        featured — 홈 최상단에 노출
      </label>

      {/* 본문 — WYSIWYG 자체가 미리보기(실제 본문과 같은 .prose 스타일) */}
      <div
        style={{ borderTop: "1px solid var(--line)", paddingTop: 8, minHeight: 420, cursor: "text" }}
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
      <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>
        마크다운 단축키가 그대로 먹어요: <code># 제목</code>, <code>**굵게**</code>, <code>- 리스트</code>, <code>&gt; 인용</code>,{" "}
        <code>```코드</code> · 이미지는 붙여넣기(⌘V)
      </p>

      {/* excerpt */}
      <textarea
        value={excerptTouched ? excerpt : ""}
        onChange={(e) => {
          setExcerpt(e.target.value);
          setExcerptTouched(true);
        }}
        placeholder="발췌(excerpt) — 비워두면 첫 문단에서 자동 생성"
        aria-label="발췌"
        rows={2}
        style={{
          width: "100%",
          marginTop: 26,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid var(--line)",
          background: "var(--soft)",
          color: "var(--fg)",
          fontSize: ".9rem",
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
        <button
          onClick={save}
          disabled={!title.trim()}
          style={{
            padding: "9px 22px",
            borderRadius: 999,
            border: 0,
            background: title.trim() ? "var(--fg)" : "var(--line)",
            color: "var(--bg)",
            fontWeight: 700,
            fontSize: ".92rem",
            cursor: title.trim() ? "pointer" : "default",
          }}
        >
          파일로 저장
        </button>
        {status && <span style={{ fontSize: 13, color: "var(--dim)" }}>{status}</span>}
      </div>
    </div>
  );
}
