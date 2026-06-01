"use client";
import { useState } from "react";
import type { CommentNode } from "@/lib/comments";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

function countAll(nodes: CommentNode[]): number {
  return nodes.reduce((n, c) => n + 1 + countAll(c.children), 0);
}

export default function CommentSection({
  postSlug,
  initialComments,
}: {
  postSlug: string;
  initialComments: CommentNode[];
}) {
  const [comments] = useState(initialComments);
  const total = countAll(comments);

  return (
    <section>
      <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 18, letterSpacing: "-0.02em" }}>
        댓글 <span style={{ color: "var(--accent)" }}>{total}</span>
      </h2>

      {/* 최상위 댓글 작성 폼 */}
      <CommentForm postSlug={postSlug} parentId={null} />

      {/* 댓글 트리 */}
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {comments.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>첫 댓글을 남겨봐! ✨</p>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} postSlug={postSlug} depth={0} />)
        )}
      </div>
    </section>
  );
}
