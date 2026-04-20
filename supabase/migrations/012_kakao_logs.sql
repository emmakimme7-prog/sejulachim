-- 카카오 알림톡 발송 로그 (이메일 로그와 대칭).
-- solapi group_id / message_id 로 실패·성공 추적.

create table if not exists kakao_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  daily_pick_id uuid references daily_picks(id) on delete restrict,
  sent_at timestamptz,
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_group_id text,
  provider_message_id text,
  error_detail text,
  mode text not null default 'daily',
  created_at timestamptz not null default now(),
  unique (user_id, daily_pick_id, mode)
);

create index if not exists idx_kakao_logs_user on kakao_logs (user_id, created_at desc);
create index if not exists idx_kakao_logs_daily_pick on kakao_logs (daily_pick_id, status);
