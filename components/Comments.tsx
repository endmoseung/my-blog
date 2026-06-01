import { isCommentsEnabled } from "@/lib/supabase";
import { getComments } from "@/lib/comments";
import CommentSection from "./comments/CommentSection";

// 서버 컴포넌트: 댓글을 불러와 클라이언트 UI로 넘긴다.
export default async function Comments({ postSlug }: { postSlug: string }) {
  if (!isCommentsEnabled) {
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
        💬 댓글은 Supabase 연결 후 활성화돼. (README의 “댓글 켜기” 참고)
      </div>
    );
  }
  const comments = await getComments(postSlug);
  return (
    <div style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
      <CommentSection postSlug={postSlug} initialComments={comments} />
    </div>
  );
}
