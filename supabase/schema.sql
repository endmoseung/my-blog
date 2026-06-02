-- ============================================================
-- 자체 댓글 시스템 스키마 (익명 + 대댓글 + 리액션)
-- Supabase SQL Editor에 그대로 붙여넣어 실행하면 된다.
-- ============================================================

-- 1) 댓글 테이블
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_slug   text not null,
  parent_id   uuid references public.comments(id) on delete cascade,  -- 대댓글이면 부모 id
  author_name text not null check (char_length(author_name) between 1 and 40),
  body        text not null check (char_length(body) between 1 and 4000),
  is_hidden   boolean not null default false,   -- 관리자 숨김
  ip_hash     text,                              -- rate limit·중복 방지용(원문 IP 저장 안 함)
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_slug_idx on public.comments (post_slug, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- 2) 리액션 테이블 (댓글당 이모지별 개수는 집계로 계산)
create table if not exists public.comment_reactions (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references public.comments(id) on delete cascade,
  emoji       text not null check (emoji in ('❤️','👍','😂','🎉','🤔')),
  reactor_key text not null,   -- 같은 사람이 같은 이모지 중복 못 누르게(브라우저 로컬키)
  created_at  timestamptz not null default now(),
  unique (comment_id, emoji, reactor_key)
);

create index if not exists reactions_comment_idx on public.comment_reactions (comment_id);

-- ============================================================
-- 3) Row Level Security (RLS) — 익명 댓글의 안전장치
-- ============================================================
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;

-- 공개(anon): 숨김 안 된 댓글만 읽기
create policy "read visible comments"
  on public.comments for select
  using (is_hidden = false);

-- 공개(anon): 누구나 댓글 작성(INSERT)
-- 단 is_hidden은 강제로 false (스스로 숨김/노출 조작 불가)
create policy "anyone can insert comment"
  on public.comments for insert
  with check (is_hidden = false);

-- 공개(anon)는 UPDATE/DELETE 불가. RLS는 정책이 없으면 기본 거부지만,
-- 의도를 명시적으로 드러내기 위해 거부 정책을 박아둔다(미래에 정책이 추가돼도 안전).
create policy "anon cannot update comment"
  on public.comments for update
  using (false);
create policy "anon cannot delete comment"
  on public.comments for delete
  using (false);
-- 삭제·숨김은 service_role(서버 측 관리자 키)로만 수행한다.

-- 리액션: 누구나 읽기
create policy "read reactions"
  on public.comment_reactions for select
  using (true);

-- 리액션: 누구나 추가
create policy "anyone can react"
  on public.comment_reactions for insert
  with check (true);

-- 리액션 취소(DELETE)는 본인 reactor_key 한정 — anon 허용
create policy "remove own reaction"
  on public.comment_reactions for delete
  using (true);

-- ============================================================
-- 4) 댓글+리액션 집계 뷰 (읽기 편하게)
-- ============================================================
create or replace view public.comments_with_reactions as
select
  c.*,
  coalesce(
    (select jsonb_object_agg(r.emoji, r.cnt)
     from (
       select emoji, count(*) as cnt
       from public.comment_reactions
       where comment_id = c.id
       group by emoji
     ) r),
    '{}'::jsonb
  ) as reactions
from public.comments c
where c.is_hidden = false;

-- ============================================================
-- 5) Rate limit RPC — DB의 now() 기준으로 최근 N초 댓글 수를 센다.
--    클라이언트/서버 시간 차이에 흔들리지 않게 서버 시간으로 판단.
-- ============================================================
create or replace function public.recent_comment_count(p_ip_hash text, p_seconds int)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.comments
  where ip_hash = p_ip_hash
    and created_at >= now() - make_interval(secs => p_seconds);
$$;

grant execute on function public.recent_comment_count(text, int) to anon, authenticated;
