import "server-only";
import crypto from "node:crypto";
import { getPublicClient, getAdminClient } from "./supabase";

export type Comment = {
  id: string;
  post_slug: string;
  parent_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  reactions: Record<string, number>;
};

// 부모-자식 트리 형태
export type CommentNode = Comment & { children: CommentNode[] };

// 댓글 + 리액션 집계를 트리로 반환
export async function getComments(postSlug: string): Promise<CommentNode[]> {
  const sb = getPublicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("comments_with_reactions")
    .select("*")
    .eq("post_slug", postSlug)
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const rows = data as Comment[];
  const byId = new Map<string, CommentNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: CommentNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// IP를 해시로만 저장(원문 미보관) — rate limit·중복 추적용
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "blog-default-salt";
  return crypto.createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export type AddResult = { ok: true } | { ok: false; error: string };

// 댓글 작성 — honeypot + rate limit + 길이 검증
export async function addComment(opts: {
  postSlug: string;
  parentId: string | null;
  authorName: string;
  body: string;
  honeypot: string; // 봇 함정: 사람은 비워둠
  ip: string;
}): Promise<AddResult> {
  // 1) honeypot이 채워졌으면 봇 → 조용히 성공한 척(공격자에게 단서 안 줌)
  if (opts.honeypot.trim() !== "") return { ok: true };

  const name = opts.authorName.trim();
  const body = opts.body.trim();
  if (name.length < 1 || name.length > 40) return { ok: false, error: "이름은 1~40자로 입력해줘." };
  if (body.length < 1 || body.length > 4000) return { ok: false, error: "댓글은 1~4000자로 입력해줘." };

  const sb = getPublicClient();
  if (!sb) return { ok: false, error: "댓글 기능이 아직 설정되지 않았어." };

  const ipHash = hashIp(opts.ip);

  // 2) rate limit — 최근 60초에 같은 IP가 3개 이상이면 거부
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await sb
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { ok: false, error: "조금 천천히! 잠시 후 다시 시도해줘." };

  const { error } = await sb.from("comments").insert({
    post_slug: opts.postSlug,
    parent_id: opts.parentId,
    author_name: name,
    body,
    ip_hash: ipHash,
  });
  if (error) return { ok: false, error: "댓글 저장에 실패했어. 잠시 후 다시 시도해줘." };
  return { ok: true };
}

// 리액션 토글 — 같은 (댓글,이모지,reactor) 있으면 취소, 없으면 추가
export async function toggleReaction(opts: {
  commentId: string;
  emoji: string;
  reactorKey: string;
}): Promise<AddResult> {
  const sb = getPublicClient();
  if (!sb) return { ok: false, error: "비활성" };
  const { data: existing } = await sb
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", opts.commentId)
    .eq("emoji", opts.emoji)
    .eq("reactor_key", opts.reactorKey)
    .maybeSingle();

  if (existing) {
    await sb.from("comment_reactions").delete().eq("id", existing.id);
  } else {
    await sb.from("comment_reactions").insert({
      comment_id: opts.commentId,
      emoji: opts.emoji,
      reactor_key: opts.reactorKey,
    });
  }
  return { ok: true };
}

// 관리자 삭제(숨김) — service_role 필요. 비밀 토큰으로 보호.
export async function adminHideComment(commentId: string, token: string): Promise<AddResult> {
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return { ok: false, error: "권한 없음" };
  }
  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "관리자 키 미설정" };
  const { error } = await admin.from("comments").update({ is_hidden: true }).eq("id", commentId);
  if (error) return { ok: false, error: "삭제 실패" };
  return { ok: true };
}
