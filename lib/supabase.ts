import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 서버 전용(관리자 삭제)

// 키가 없으면 null → UI에서 "댓글 설정 후 활성화" 안내로 graceful degrade.
export const isCommentsEnabled = Boolean(url && anonKey);

// 공개용 클라이언트(anon). 브라우저·서버 양쪽에서 읽기/작성에 사용.
export function getPublicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

// 관리자용 클라이언트(service_role). 서버에서만, 삭제/숨김에만 사용.
export function getAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
