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

  // parent_id가 자기 자신을 가리키는 경우(self-loop)는 끊어서 루트로
  // 순환(A→B→A)은 루트까지 거슬러 올라가며 visited로 감지해 끊는다
  const reachesRoot = (start: CommentNode): boolean => {
    const seen = new Set<string>();
    let cur: CommentNode | undefined = start;
    while (cur && cur.parent_id) {
      if (seen.has(cur.id)) return false; // 순환 발견
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    return true;
  };

  const roots: CommentNode[] = [];
  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    // 부모가 (a) 없거나 (b) 조회에서 빠졌거나(숨김) (c) 자기 자신이거나 (d) 순환이면 루트로 승격.
    // 단 부모가 같은 글에 있을 때만 자식으로 붙여 "고아 대댓글이 엉뚱한 곳에 붙는" 일을 막는다.
    if (parent && parent.id !== node.id && parent.post_slug === node.post_slug && reachesRoot(node)) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// IP를 해시로만 저장(원문 미보관) — rate limit·중복 추적용.
// salt는 환경변수 필수. 없으면 약한 해시라 차라리 막는 게 안전(설정 누락을 빌드/런타임에 드러냄).
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT 환경변수가 필요합니다(.env.local 참고).");
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

  let ipHash: string;
  try {
    ipHash = hashIp(opts.ip);
  } catch {
    return { ok: false, error: "댓글 기능이 아직 설정되지 않았어." };
  }

  // 2) rate limit — 최근 60초에 같은 IP가 3개 이상이면 거부.
  //    DB의 now()로 윈도우를 판단해 클라이언트/서버 시간 차이에 안 흔들리게 한다(RPC).
  const { data: recent, error: rlErr } = await sb.rpc("recent_comment_count", {
    p_ip_hash: ipHash,
    p_seconds: 60,
  });
  if (!rlErr && typeof recent === "number" && recent >= 3) {
    return { ok: false, error: "조금 천천히! 잠시 후 다시 시도해줘." };
  }

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
