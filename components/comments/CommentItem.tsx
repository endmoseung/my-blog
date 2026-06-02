"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommentNode } from "@/lib/comments";
import { reactToComment, hideComment } from "@/app/actions/comments";
import CommentForm from "./CommentForm";

const ADMIN_KEY = "blog_admin_token";

const EMOJIS = ["❤️", "👍", "😂", "🎉", "🤔"];
const EMOJI_LABEL: Record<string, string> = {
  "❤️": "좋아요", "👍": "추천", "😂": "웃겨요", "🎉": "축하", "🤔": "음…",
};
const REACTOR_KEY = "blog_reactor_key";

function getReactorKey(): string {
  if (typeof window === "undefined") return "ssr";
  let k = localStorage.getItem(REACTOR_KEY);
  if (!k) {
    k = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(REACTOR_KEY, k);
  }
  return k;
}

// 이름 → 일관된 파스텔 아바타 색
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 65%)`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function CommentItem({
  comment,
  postSlug,
  depth,
}: {
  comment: CommentNode;
  postSlug: string;
  depth: number;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [, startTransition] = useTransition();

  function react(emoji: string) {
    startTransition(async () => {
      await reactToComment(comment.id, emoji, getReactorKey(), postSlug);
      router.refresh();
    });
  }

  // 관리자 삭제 — 토큰을 한 번 입력해 localStorage에 보관(노출 X), 이후 버튼으로 숨김 처리.
  function adminDelete() {
    let token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null;
    if (!token) {
      token = window.prompt("관리자 토큰을 입력하세요 (ADMIN_TOKEN)");
      if (!token) return;
      localStorage.setItem(ADMIN_KEY, token);
    }
    if (!window.confirm("이 댓글을 숨길까요?")) return;
    startTransition(async () => {
      const res = await hideComment(comment.id, token!, postSlug);
      if (!res.ok) {
        localStorage.removeItem(ADMIN_KEY);
        window.alert("권한이 없거나 실패했어요. 토큰을 다시 확인해주세요.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          background: "var(--card)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: avatarColor(comment.author_name),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: ".8rem",
            }}
          >
            {comment.author_name.slice(0, 1).toUpperCase()}
          </span>
          <strong style={{ fontSize: ".92rem" }}>{comment.author_name}</strong>
          <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>· {timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: ".95rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{comment.body}</p>

        {/* 리액션 + 답글 */}
        <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 10 }}>
          {EMOJIS.map((e) => {
            const cnt = comment.reactions[e] ?? 0;
            return (
              <button
                key={e}
                onClick={() => react(e)}
                aria-label={`${EMOJI_LABEL[e] ?? "반응"}${cnt > 0 ? ` ${cnt}개` : ""}`}
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  background: cnt > 0 ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  fontSize: ".82rem",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {e} {cnt > 0 ? cnt : ""}
              </button>
            );
          })}
          {depth < 3 && (
            <button
              onClick={() => setReplying((v) => !v)}
              aria-expanded={replying}
              style={{ marginLeft: 4, background: "none", border: 0, color: "var(--muted)", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}
            >
              답글
            </button>
          )}
          <button
            onClick={adminDelete}
            title="관리자 숨김"
            aria-label="관리자: 이 댓글 숨기기"
            style={{ background: "none", border: 0, color: "var(--muted)", fontSize: ".75rem", cursor: "pointer", opacity: 0.5 }}
          >
            숨김
          </button>
        </div>

        {replying && (
          <div style={{ marginTop: 12 }}>
            <CommentForm
              postSlug={postSlug}
              parentId={comment.id}
              compact
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {/* 대댓글 재귀 */}
      {comment.children.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12, borderLeft: "2px solid var(--line)", paddingLeft: 8 }}>
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} postSlug={postSlug} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
