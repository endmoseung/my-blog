"use client";
import { useEffect, useRef, useState } from "react";
import { makeSlug } from "@/lib/editor";

export const EXCERPT_MAX = 150;

export type PublishFields = { excerpt: string; slug: string; featured: boolean; coverImage: string };

type Props = {
  isEdit: boolean;
  initial: PublishFields;
  // 비워 두면 들어갈 자동 소개글 — 자리표시 글자로 미리 보여 준다.
  autoExcerpt: string;
  busy: boolean;
  error: string | null;
  // 미리보기 변환 오류 — 저장을 막지는 않고 경고만 한다(미리보기가 마지막 입력을 아직 못 따라왔을 수 있어서).
  mdxError: string | null;
  onUploadCover(file: File): Promise<string | null>;
  // 취소해도 창에서 고친 값(올린 대표 이미지 등)은 부모가 이어받는다.
  onCancel(fields: PublishFields): void;
  onPublish(fields: PublishFields): void;
};

// velog 「출간하기」 창 — 대표 이미지·소개글·URL·홈 노출을 마지막으로 확인하고 저장한다.
export default function PublishModal({ isEdit, initial, autoExcerpt, busy, error, mdxError, onUploadCover, onCancel, onPublish }: Props) {
  const [fields, setFields] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<PublishFields>) => setFields((f) => ({ ...f, ...patch }));

  // 열릴 때 한 번만 창 안으로 포커스를 옮기고, 닫히면 열기 전 자리(「출간하기」 버튼)로 돌려준다.
  // 부모가 다시 그려져도(자동 임시저장 등) 포커스를 뺏지 않게 최신 값은 ref로 읽는다.
  const latest = useRef({ busy, onCancel, fields });
  useEffect(() => {
    latest.current = { busy, onCancel, fields };
  });
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !latest.current.busy) latest.current.onCancel(latest.current.fields);
      // Tab이 창 밖(뒤의 편집기)으로 나가지 않게 처음·끝에서 돌린다.
      if (e.key === "Tab" && dialog.current) {
        const items = dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]):not([hidden]), textarea");
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  const savedSlug = makeSlug(fields.slug);

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    let url: string | null = null;
    try {
      url = await onUploadCover(file);
    } finally {
      setUploading(false);
    }
    if (url) set({ coverImage: url });
    else setUploadError("이미지를 올리지 못했어요.");
  };

  return (
    <div className="ved-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel(fields)}>
      <div ref={dialog} className="ved-modal" role="dialog" aria-modal="true" aria-labelledby="ved-modal-title" tabIndex={-1}>
        <h2 id="ved-modal-title" className="ved-modal-h">
          {isEdit ? "수정한 글 저장" : "출간 설정"}
        </h2>

        <div className="ved-modal-grid">
          <section>
            <h3 className="ved-label">대표 이미지</h3>
            <button type="button" className="ved-thumb" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {fields.coverImage ? (
                // 로컬 업로드 파일 미리보기라 next/image 최적화가 필요 없다.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fields.coverImage} alt="대표 이미지 미리보기" />
              ) : (
                <span>{uploading ? "올리는 중…" : "이미지 올리기 · 없으면 자동 OG 이미지를 써요"}</span>
              )}
            </button>
            {fields.coverImage && (
              <button type="button" className="ved-link-btn" onClick={() => set({ coverImage: "" })}>
                대표 이미지 빼기
              </button>
            )}
            {uploadError && <p className="ved-warn">{uploadError}</p>}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                pickCover(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            <h3 className="ved-label" style={{ marginTop: 22 }}>
              소개글
            </h3>
            <textarea
              className="ved-field"
              rows={4}
              maxLength={EXCERPT_MAX}
              value={fields.excerpt}
              placeholder={autoExcerpt ? `비워 두면 이렇게 들어가요: ${autoExcerpt}` : "목록에 보일 한두 문장 — 비워 두면 첫 문단에서 만들어요"}
              onChange={(e) => set({ excerpt: e.target.value })}
              aria-label="소개글"
            />
            <p className="ved-count">
              {fields.excerpt.length}/{EXCERPT_MAX}
            </p>
          </section>

          <section>
            <h3 className="ved-label">URL</h3>
            <div className="ved-url">
              <span>/blog/</span>
              <input
                value={fields.slug}
                onChange={(e) => set({ slug: e.target.value })}
                disabled={isEdit}
                aria-label="URL"
                spellCheck={false}
              />
            </div>
            <p className="ved-hint">
              {isEdit
                ? "이미 공개된 글이라 주소가 바뀌지 않게 고정했어요."
                : savedSlug
                  ? `content/posts/${savedSlug}.mdx 로 저장돼요.`
                  : "글자나 숫자를 넣어 주세요. 특수문자는 빠져요."}
            </p>

            <h3 className="ved-label" style={{ marginTop: 22 }}>
              홈 노출
            </h3>
            <label className="ved-check">
              <input type="checkbox" checked={fields.featured} onChange={(e) => set({ featured: e.target.checked })} />
              featured — 홈 맨 위에 크게 보여요
            </label>

            {mdxError && <p className="ved-warn">본문에 MDX 변환 오류가 있어요. 이대로 저장하면 글 화면이 깨지니 미리보기의 오류를 먼저 확인하세요.</p>}
            {error && (
              <p className="ved-warn" role="alert">
                {error}
              </p>
            )}

            <div className="ved-modal-actions">
              <button type="button" className="ved-btn-ghost" onClick={() => onCancel(fields)} disabled={busy}>
                취소
              </button>
              <button
                type="button"
                className="ved-btn-primary"
                onClick={() => onPublish(fields)}
                disabled={busy || uploading || (!isEdit && !savedSlug)}
              >
                {busy ? "저장 중…" : isEdit ? "수정하기" : "출간하기"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
