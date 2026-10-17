"use client";
import { useEffect, useRef, useState } from "react";
import { makeSlug, autoExcerpt, addTags, localDate, type DraftMeta } from "@/lib/editor";
import { parseDraft, pickStart, isDirty, type Draft } from "@/lib/editor-draft";
import type { FormatKind } from "@/lib/md-format";
import MarkdownInput, { type MarkdownInputApi } from "./MarkdownInput";
import Preview from "./Preview";
import PublishModal, { EXCERPT_MAX, type PublishFields } from "./PublishModal";

const AUTOSAVE_MS = 20_000;

export type EditorInitial = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  featured: boolean;
  coverImage: string;
  markdown: string;
  date: string;
};

// 임시저장 키(editor_draft_v1)는 예전 편집기와 같게 둔다 — 새 글 초안은 예전 형식도 그대로 읽힌다.
// 수정 모드에서 어떤 초안을 믿는지는 lib/editor-draft.ts의 pickStart가 정한다.

const TOOLBAR: Array<{ kind: FormatKind; label: React.ReactNode; title: string } | "|" | "image"> = [
  { kind: "h1", label: <>H<sub>1</sub></>, title: "제목 1" },
  { kind: "h2", label: <>H<sub>2</sub></>, title: "제목 2" },
  { kind: "h3", label: <>H<sub>3</sub></>, title: "제목 3" },
  { kind: "h4", label: <>H<sub>4</sub></>, title: "제목 4" },
  "|",
  { kind: "bold", label: <b>B</b>, title: "굵게 (⌘B)" },
  { kind: "italic", label: <i>I</i>, title: "기울임 (⌘I)" },
  { kind: "strike", label: <s>S</s>, title: "취소선 (⌘⇧X)" },
  "|",
  { kind: "quote", label: "❝", title: "인용" },
  { kind: "link", label: "🔗", title: "링크 (⌘K)" },
  "image",
  { kind: "code", label: "`", title: "인라인 코드 (⌘E)" },
  { kind: "codeblock", label: "</>", title: "코드 블록" },
];

// 이미지 업로드 — 붙여넣기·끌어다 놓기·툴바·대표 이미지 공용. public/images/<slug>/ 에 저장된다.
async function uploadImage(file: File, slug: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("slug", slug || "draft");
  try {
    const res = await fetch("/editor/api/image", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return typeof data === "object" && data !== null && "url" in data && typeof data.url === "string" ? data.url : null;
  } catch {
    // dev 서버가 재시작 중이면 fetch가 reject된다 — 실패로 돌려 호출한 쪽이 상태를 풀게 한다.
    return null;
  }
}

function persistDraft(key: string, value: Draft, base: Draft) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, base }));
  } catch {
    /* 저장소가 가득 찼거나 막힘 — 파일 저장에는 영향 없음 */
  }
}

const now = () => new Date().toLocaleTimeString("ko-KR", { hour12: false });

/* ── velog식 편집기 — 왼쪽 마크다운, 오른쪽 실제 글과 같은 미리보기 ── */
// 브라우저 전용으로만 그려진다(EditorLoader가 ssr:false로 불러옴) → useState 초기화에서 localStorage를 읽어도 된다.
export default function EditorShell({ knownTags, initial }: { knownTags: string[]; initial?: EditorInitial }) {
  const isEdit = !!initial;
  const draftKey = isEdit ? `editor_draft_v1:${initial.slug}` : "editor_draft_v1";

  // 시작 값: 믿을 수 있는 임시저장본이 있으면 그것, 없으면 원본(수정) 또는 빈 글(새 글)
  const [start] = useState(() => {
    const base: Draft = {
      title: initial?.title ?? "",
      tags: initial?.tags ?? [],
      markdown: initial?.markdown ?? "",
      excerpt: initial?.excerpt ?? "",
      featured: initial?.featured ?? false,
      coverImage: initial?.coverImage ?? "",
      slug: initial?.slug ?? "",
    };
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(draftKey);
    } catch {
      /* 저장소를 못 쓰는 브라우저 — 초안 없이 시작 */
    }
    return { ...pickStart(parseDraft(raw), base, isEdit), base };
  });

  const [title, setTitle] = useState(start.value.title);
  const [tags, setTags] = useState(start.value.tags);
  const [tagInput, setTagInput] = useState("");
  const [tagFocus, setTagFocus] = useState(false);
  const [markdown, setMarkdown] = useState(start.value.markdown);
  // slug는 새 글에서 출간 창으로 직접 고쳤을 때만 채워진다(빈 값이면 제목을 따라감).
  const [publish, setPublish] = useState<PublishFields>({
    excerpt: start.value.excerpt,
    featured: start.value.featured,
    coverImage: start.value.coverImage,
    slug: start.value.slug,
  });
  const [status, setStatus] = useState<string | null>(start.restored ? "임시저장본을 불러왔어요." : null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState<{ slug: string; path: string } | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [mdxError, setMdxError] = useState<string | null>(null);

  const inputApi = useRef<MarkdownInputApi | null>(null);
  const previewPane = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // 새 글은 출간 창에서 URL을 직접 고치기 전까지 제목을 따라간다.
  const slug = isEdit ? initial.slug : publish.slug || makeSlug(title);

  // 임시저장에 쓸 최신 값 — 타이머가 타이핑마다 다시 걸리지 않게 ref로 읽는다.
  const latest = useRef<Draft>(start.value);
  useEffect(() => {
    latest.current = { title, tags, markdown, ...publish };
  }, [title, tags, markdown, publish]);

  // 초안은 {value, base}로 저장한다. base(이 초안을 시작할 때의 원본)가 있어야 다음에 열 때
  // 그사이 파일이 바뀌었는지 알 수 있다.
  const writeDraft = () => persistDraft(draftKey, latest.current, start.base);
  const saveDraft = () => {
    writeDraft();
    setStatus(`임시저장 ${now()}`);
  };

  // 저장(출간)을 마치면 멈춘다 — 계속 돌면 지운 임시저장본을 다시 만들어,
  // 다음 「새 글」이 이미 출간한 글로 열린다.
  const saved = done !== null;
  useEffect(() => {
    if (saved) return;
    const id = setInterval(() => {
      // 바뀐 게 없으면 남기지 않는다 — 원본 사본이 초안으로 쌓이지 않게
      if (!isDirty(latest.current, start.base)) return;
      persistDraft(draftKey, latest.current, start.base);
      setStatus(`자동 임시저장 ${now()}`);
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [draftKey, saved, start.base]);

  const insertImages = async (files: File[]) => {
    setStatus("이미지 올리는 중…");
    for (const f of files) {
      const url = await uploadImage(f, slug);
      if (url) inputApi.current?.insertImage(url);
      else {
        setStatus("이미지 업로드에 실패했어요.");
        return;
      }
    }
    setStatus("이미지를 넣었어요.");
  };

  const commitTagInput = (raw: string) => {
    setTags((prev) => addTags(prev, raw));
    setTagInput("");
  };

  const suggestions = knownTags.filter((t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.trim().toLowerCase())).slice(0, 8);

  // 출간 창에서 고친 값을 부모에 남긴다. URL을 건드리지 않았으면 계속 제목을 따라가도록 비워 둔다.
  const keepFields = (fields: PublishFields) => setPublish({ ...fields, slug: fields.slug === slug ? publish.slug : fields.slug });

  const doPublish = async (fields: PublishFields) => {
    keepFields(fields);
    setSaving(true);
    setSaveError(null);
    const meta: DraftMeta = {
      title: title.trim(),
      date: initial?.date ?? localDate(),
      excerpt: fields.excerpt.trim() || autoExcerpt(markdown),
      tags,
      featured: fields.featured,
      coverImage: fields.coverImage,
    };
    let res: Response;
    try {
      res = await fetch("/editor/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { mode: "update", slug: initial.slug, meta, markdown } : { mode: "create", slug: fields.slug, meta, markdown },
        ),
      });
    } catch {
      // 네트워크 실패에서도 출간 창이 잠기지 않게 저장 중 상태를 푼다.
      setSaving(false);
      setSaveError("저장 요청을 보내지 못했어요. dev 서버가 켜져 있는지 확인해 주세요.");
      return;
    }
    const data: unknown = await res.json().catch(() => null);
    setSaving(false);
    const obj = typeof data === "object" && data !== null ? data : {};
    if (!res.ok) {
      setSaveError("error" in obj && typeof obj.error === "string" ? obj.error : "저장에 실패했어요.");
      return;
    }
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* 무시 */
    }
    setModalOpen(false);
    setDone({
      slug: "slug" in obj && typeof obj.slug === "string" ? obj.slug : slug,
      path: "path" in obj && typeof obj.path === "string" ? obj.path : "",
    });
  };

  const exit = () => {
    // 나가도 쓰던 내용이 남도록 바뀐 게 있으면 임시저장부터
    if (isDirty(latest.current, start.base)) writeDraft();
    window.location.href = "/editor";
  };

  // 복원한 초안을 버리고 파일(또는 빈 글)로 다시 연다.
  const discardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* 무시 */
    }
    window.location.reload();
  };

  /* 출간 완료 화면 */
  if (done) {
    return (
      <div className="ved ved-done">
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.7rem", letterSpacing: "-0.02em" }}>{isEdit ? "수정했어요 ✓" : "출간했어요 ✓"}</h1>
          <p style={{ color: "var(--dim)", marginTop: 12, fontSize: 14.5 }}>
            <code>{done.path}</code> 에 저장했어요. 블로그에 올리려면 커밋하고 푸시해 주세요.
          </p>
          <p style={{ marginTop: 24, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href={`/blog/${encodeURIComponent(done.slug)}`} className="u" style={{ fontWeight: 650 }}>
              글 보러 가기 →
            </a>
            <a href={`/editor/write?slug=${encodeURIComponent(done.slug)}`} className="u" style={{ fontWeight: 650, color: "var(--dim)" }}>
              계속 수정하기
            </a>
            <a href="/editor" className="u" style={{ fontWeight: 650, color: "var(--dim)" }}>
              목록으로
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ved"
      data-tab={tab}
      onKeyDown={(e) => {
        // ⌘S / Ctrl+S — 어느 입력칸에 있든 브라우저 「페이지 저장」 대신 임시저장
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          saveDraft();
        }
      }}
    >
      {/* 좁은 화면 전용 — 작성/미리보기 전환 */}
      <div className="ved-tabs" role="tablist" aria-label="보기 전환">
        <button role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")}>
          작성
        </button>
        <button role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")}>
          미리보기
        </button>
      </div>

      <section className="ved-write">
        <div className="ved-head">
          <textarea
            className="ved-title"
            value={title}
            rows={1}
            placeholder="제목을 입력하세요"
            aria-label="제목"
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
            onKeyDown={(e) => {
              // 한글 조합 중 Enter는 글자 확정용 — 그때 본문으로 넘기면 남은 Enter가 본문에 줄바꿈을 넣는다
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                inputApi.current?.focus();
              }
            }}
          />
          <div className="ved-divider" aria-hidden />
          <div className="ved-tags">
            {tags.map((t) => (
              <button key={t} type="button" className="ved-tag" title="눌러서 빼기" onClick={() => setTags(tags.filter((x) => x !== t))}>
                {t}
              </button>
            ))}
            <div className="ved-tag-input-wrap">
              <input
                className="ved-tag-input"
                value={tagInput}
                placeholder={tags.length ? "" : "태그를 입력하세요"}
                aria-label="태그 입력"
                onFocus={() => setTagFocus(true)}
                onBlur={() => {
                  setTagFocus(false);
                  if (tagInput.trim()) commitTagInput(tagInput);
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes(",")) commitTagInput(v);
                  else setTagInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    commitTagInput(tagInput);
                  } else if (e.key === "Backspace" && !tagInput && tags.length) {
                    setTags(tags.slice(0, -1));
                  }
                }}
              />
              {tagFocus && suggestions.length > 0 && (
                <div className="ved-suggest" role="listbox" aria-label="기존 태그">
                  {suggestions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitTagInput(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {tagFocus && <p className="ved-hint">Enter나 쉼표로 태그를 넣고, Backspace로 지워요.</p>}
        </div>

        <div className="ved-toolbar" role="toolbar" aria-label="서식">
          {TOOLBAR.map((it, i) =>
            it === "|" ? (
              <span key={i} className="ved-sep" aria-hidden />
            ) : it === "image" ? (
              <button key={i} type="button" className="ved-tool" title="이미지 올리기" onClick={() => fileInput.current?.click()}>
                🖼
              </button>
            ) : (
              <button
                key={i}
                type="button"
                className="ved-tool"
                title={it.title}
                aria-label={it.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => inputApi.current?.format(it.kind)}
              >
                {it.label}
              </button>
            ),
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              if (files.length) insertImages(files);
              e.target.value = "";
            }}
          />
        </div>

        <MarkdownInput
          initialValue={start.value.markdown}
          apiRef={inputApi}
          onChange={setMarkdown}
          onImageFiles={insertImages}
          onScrollRatio={(r) => {
            const el = previewPane.current;
            if (el) el.scrollTop = r * (el.scrollHeight - el.clientHeight);
          }}
        />
      </section>

      <footer className="ved-foot">
        <button type="button" className="ved-exit" onClick={exit}>
          ← 나가기
        </button>
        <span className="ved-status" aria-live="polite">
          {status ?? "바뀐 내용은 20초마다 자동 임시저장해요"}
          {start.restored && (
            <button type="button" className="ved-link-btn" style={{ marginLeft: 10 }} onClick={discardDraft}>
              {isEdit ? "파일 내용으로 되돌리기" : "비우고 새로 쓰기"}
            </button>
          )}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="ved-btn-ghost" onClick={saveDraft}>
            임시저장
          </button>
          <button
            type="button"
            className="ved-btn-primary"
            disabled={!title.trim()}
            title={title.trim() ? undefined : "제목을 먼저 입력하세요"}
            onClick={() => {
              setSaveError(null);
              setModalOpen(true);
            }}
          >
            {isEdit ? "수정하기" : "출간하기"}
          </button>
        </div>
      </footer>

      <div className="ved-preview" ref={previewPane}>
        <Preview title={title} tags={tags} markdown={markdown} onErrorChange={setMdxError} />
      </div>

      {modalOpen && (
        <PublishModal
          isEdit={isEdit}
          initial={{ ...publish, slug }}
          autoExcerpt={autoExcerpt(markdown).slice(0, EXCERPT_MAX)}
          busy={saving}
          error={saveError}
          mdxError={mdxError}
          onUploadCover={(file) => uploadImage(file, slug)}
          onCancel={(fields) => {
            keepFields(fields);
            setModalOpen(false);
          }}
          onPublish={doPublish}
        />
      )}
    </div>
  );
}
