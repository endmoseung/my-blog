"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitComment } from "@/app/actions/comments";

const NAME_KEY = "blog_comment_name";

export default function CommentForm({
  postSlug,
  parentId,
  onDone,
  compact = false,
}: {
  postSlug: string;
  parentId: string | null;
  onDone?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 마지막에 쓴 이름 기억(편의) — localStorage는 클라에서만
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(NAME_KEY) ?? "" : ""
  );
  const [body, setBody] = useState("");

  function action(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitComment(formData);
      if (res.ok) {
        if (typeof window !== "undefined") localStorage.setItem(NAME_KEY, name);
        setBody("");
        router.refresh(); // 서버 컴포넌트 다시 불러와 새 댓글 반영
        onDone?.();
      } else {
        setError(res.error);
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "var(--bg)",
    color: "var(--fg)",
    fontSize: ".95rem",
    fontFamily: "inherit",
  };

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="hidden" name="postSlug" value={postSlug} />
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      {/* honeypot: 사람 눈엔 안 보이고 봇만 채움 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <input
        name="authorName"
        aria-label="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
        maxLength={40}
        required
        style={{ ...inputStyle, maxWidth: 240 }}
      />
      <textarea
        name="body"
        aria-label={compact ? "답글 내용" : "댓글 내용"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={compact ? "답글을 남겨봐…" : "댓글을 남겨봐 — 로그인 필요 없어 :)"}
        maxLength={4000}
        required
        rows={compact ? 2 : 3}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      {error && <p style={{ color: "#e03131", fontSize: ".85rem" }}>{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: 0,
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 700,
            fontSize: ".9rem",
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "올리는 중…" : compact ? "답글 달기" : "댓글 남기기"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: ".9rem", cursor: "pointer" }}
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
