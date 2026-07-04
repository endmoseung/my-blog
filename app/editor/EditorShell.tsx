"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { makeSlug, autoExcerpt, type DraftMeta } from "@/lib/editor";

const AUTOSAVE_MS = 20_000;

type Draft = { title: string; tags: string[]; excerpt: string; featured: boolean; markdown: string };
export type EditorInitial = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  featured: boolean;
  markdown: string;
  date: string;
};

/* ── 툴바 ─────────────────────────────────────────────── */
function Toolbar({ editor, onImagePick }: { editor: Editor | null; onImagePick: () => void }) {
  // 선택 위치가 바뀔 때마다 active 상태를 다시 그린다 (이벤트 구독 — effect 내 동기 setState 아님)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    editor.on("selectionUpdate", bump);
    return () => {
      editor.off("transaction", bump);
      editor.off("selectionUpdate", bump);
    };
  }, [editor]);

  if (!editor) return null;
  const c = editor.chain().focus();

  const items: Array<{ label: string; title: string; on: boolean; run: () => void } | "|"> = [
    { label: "H2", title: "큰 제목", on: editor.isActive("heading", { level: 2 }), run: () => c.toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "작은 제목", on: editor.isActive("heading", { level: 3 }), run: () => c.toggleHeading({ level: 3 }).run() },
    "|",
    { label: "B", title: "굵게 (⌘B)", on: editor.isActive("bold"), run: () => c.toggleBold().run() },
    { label: "I", title: "기울임 (⌘I)", on: editor.isActive("italic"), run: () => c.toggleItalic().run() },
    { label: "S̶", title: "취소선", on: editor.isActive("strike"), run: () => c.toggleStrike().run() },
    "|",
    { label: "❝", title: "인용", on: editor.isActive("blockquote"), run: () => c.toggleBlockquote().run() },
    { label: "‹›", title: "인라인 코드", on: editor.isActive("code"), run: () => c.toggleCode().run() },
    { label: "{ }", title: "코드 블록", on: editor.isActive("codeBlock"), run: () => c.toggleCodeBlock().run() },
    "|",
    { label: "•", title: "목록", on: editor.isActive("bulletList"), run: () => c.toggleBulletList().run() },
    { label: "1.", title: "번호 목록", on: editor.isActive("orderedList"), run: () => c.toggleOrderedList().run() },
    "|",
    {
      label: "🔗",
      title: "링크",
      on: editor.isActive("link"),
      run: () => {
        if (editor.isActive("link")) {
          c.unsetLink().run();
          return;
        }
        const url = window.prompt("링크 URL");
        if (url) c.setLink({ href: url }).run();
      },
    },
    { label: "🖼", title: "이미지 업로드", on: false, run: onImagePick },
    { label: "―", title: "구분선", on: false, run: () => c.setHorizontalRule().run() },
  ];

  return (
    <div className="ed-toolbar" role="toolbar" aria-label="서식">
      {items.map((it, i) =>
        it === "|" ? (
          <span key={i} className="ed-sep" aria-hidden />
        ) : (
          <button key={i} type="button" title={it.title} className={`ed-btn${it.on ? " on" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={it.run}>
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}

/* ── 에디터 본체 ───────────────────────────────────────── */
export default function EditorShell({ knownTags, initial }: { knownTags: string[]; initial?: EditorInitial }) {
  const isEdit = !!initial;
  const draftKey = isEdit ? `editor_draft_v1:${initial.slug}` : "editor_draft_v1";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [excerptTouched, setExcerptTouched] = useState(isEdit && !!initial?.excerpt);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [status, setStatus] = useState<string | null>(null);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const slug = isEdit ? initial.slug : makeSlug(title);
  // 렌더 중 ref 쓰기는 금지(react-hooks/refs) — effect에서 동기화
  const slugRef = useRef("");
  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  // 이미지 업로드 — 붙여넣기/드롭/툴바 공용
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slugRef.current || "draft");
    const res = await fetch("/editor/api/image", { method: "POST", body: fd });
    if (!res.ok) return null;
    const { url } = (await res.json()) as { url: string };
    return url;
  }, []);

  const insertImages = useCallback(
    (editor: Editor, files: File[]) => {
      for (const f of files) {
        uploadImage(f).then((url) => {
          if (url) editor.chain().focus().setImage({ src: url }).run();
          else setStatus("이미지 업로드에 실패했어요.");
        });
      }
    },
    [uploadImage],
  );

  const editor = useEditor({
    immediatelyRender: false,
    // 콘텐츠 주입·초안 복원은 effect가 아니라 에디터 생성 이벤트에서 — setState-in-effect 규칙 회피
    onCreate({ editor }) {
      if (isEdit) {
        editor.commands.setContent(initial.markdown);
        return;
      }
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      try {
        const d = JSON.parse(raw) as Draft;
        if (d.title || d.markdown) {
          setTitle(d.title);
          setTags(d.tags ?? []);
          if (d.excerpt) {
            setExcerpt(d.excerpt);
            setExcerptTouched(true);
          }
          setFeatured(d.featured ?? false);
          editor.commands.setContent(d.markdown ?? "");
          setStatus("임시저장본을 복원했어요.");
        }
      } catch {
        /* 깨진 초안은 무시 */
      }
    },
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
        if (editor) insertImages(editor, files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        if (editor) insertImages(editor, files);
        return true;
      },
    },
  });

  // 툴바 이미지 버튼용 숨김 파일 입력
  const fileInput = useRef<HTMLInputElement>(null);

  // editor 인스턴스는 ref로 고정해 getMarkdown을 안정 함수로 만든다
  // (React Compiler가 editor 의존 useCallback의 메모를 보존하지 못함).
  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // tiptap-markdown이 editor.storage에 markdown을 심지만 타입 선언은 없다 —
  // 구조적 타입으로 좁혀 접근(§type-safety: as any 금지).
  // 수동 useCallback 금지 — React Compiler가 메모를 자동 처리(수동 메모는 보존 실패 에러).
  function getMarkdown() {
    const storage = editorRef.current?.storage as { markdown?: { getMarkdown(): string } } | undefined;
    return storage?.markdown?.getMarkdown() ?? "";
  }

  // 임시저장(localStorage) — 20초마다. 메타는 ref로, 본문은 저장 시점에 에디터에서 직접 읽어
  // 타이핑마다 타이머가 리셋되지 않게 한다.
  const metaRef = useRef({ title: "", tags: [] as string[], excerpt: "", featured: false });
  useEffect(() => {
    metaRef.current = { title, tags, excerpt, featured };
  }, [title, tags, excerpt, featured]);
  useEffect(() => {
    const id = setInterval(() => {
      const storage = editorRef.current?.storage as { markdown?: { getMarkdown(): string } } | undefined;
      const draft: Draft = { ...metaRef.current, markdown: storage?.markdown?.getMarkdown() ?? "" };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setAutosavedAt(new Date().toLocaleTimeString("ko-KR", { hour12: false }));
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [draftKey]);

  const addTag = (t: string) => {
    const clean = t.trim();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  };

  const save = async () => {
    const markdown = getMarkdown();
    const meta: DraftMeta = {
      title: title.trim(),
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      excerpt: excerptTouched && excerpt.trim() ? excerpt.trim() : autoExcerpt(markdown),
      tags,
      featured,
    };
    setStatus("저장 중…");
    const res = await fetch("/editor/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { mode: "update", slug: initial.slug, meta, markdown } : { mode: "create", meta, markdown }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "저장에 실패했어요.");
      return;
    }
    localStorage.removeItem(draftKey);
    if (isEdit) {
      setStatus(`저장 완료 · ${new Date().toLocaleTimeString("ko-KR", { hour12: false })}`);
    } else {
      setSavedPath(data.path);
      setStatus(null);
    }
  };

  /* 새 글 저장 완료 화면 */
  if (savedPath) {
    return (
      <div style={{ padding: "60px 0" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>저장 완료 ✓</h1>
        <p style={{ color: "var(--dim)", marginTop: 12, fontSize: 14.5 }}>
          <code>{savedPath}</code> 에 저장됐어요. 커밋·푸시는 직접 해주세요.
        </p>
        <p style={{ marginTop: 24, display: "flex", gap: 18 }}>
          <a href={`/blog/${encodeURIComponent(slug)}`} className="u" style={{ fontWeight: 650, fontSize: 14.5 }}>
            글 보러 가기 →
          </a>
          <a href={`/editor/write?slug=${encodeURIComponent(slug)}`} className="u" style={{ fontWeight: 650, fontSize: 14.5, color: "var(--dim)" }}>
            계속 수정하기
          </a>
          <a href="/editor" className="u" style={{ fontWeight: 650, fontSize: 14.5, color: "var(--dim)" }}>
            목록으로
          </a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* 제목 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
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
          marginTop: 10,
        }}
      />
      <p style={{ fontSize: 12, color: "var(--dim)", margin: "8px 0 14px", fontVariantNumeric: "tabular-nums" }}>
        content/posts/{slug || "…"}.mdx
        {isEdit ? ` · 최초 ${initial.date} (slug은 URL 보존을 위해 고정)` : ` · ${new Date().toISOString().slice(0, 10)}`}
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
          style={{ border: "none", outline: "none", background: "transparent", color: "var(--fg)", fontSize: 12.5, width: 90, fontFamily: "inherit" }}
        />
      </div>

      {/* featured */}
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--dim)", marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        featured — 홈 최상단에 노출
      </label>

      {/* 툴바 + 본문 — WYSIWYG 자체가 미리보기(실제 본문과 같은 .prose 스타일) */}
      <Toolbar editor={editor} onImagePick={() => fileInput.current?.click()} />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (editor && files.length) insertImages(editor, files);
          e.target.value = "";
        }}
      />
      <div style={{ minHeight: 420, cursor: "text", paddingTop: 4 }} onClick={() => editor?.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
      <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>
        마크다운 단축키 OK: <code># 제목</code> <code>**굵게**</code> <code>- 리스트</code> <code>&gt; 인용</code> <code>```코드</code> · 이미지는
        붙여넣기(⌘V)·드래그·툴바 🖼
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

      {/* 하단 고정 바 */}
      <div className="ed-bottom">
        <a href="/editor" className="u" style={{ fontSize: 13.5, color: "var(--dim)" }}>
          ← 목록
        </a>
        <span style={{ fontSize: 12.5, color: "var(--dim)", flex: 1, textAlign: "center" }}>
          {status ?? (autosavedAt ? `임시저장 ${autosavedAt}` : "20초마다 자동 임시저장")}
        </span>
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
          {isEdit ? "수정 저장" : "파일로 저장"}
        </button>
      </div>
    </div>
  );
}
