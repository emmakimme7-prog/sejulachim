create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  delivery_time text not null check (delivery_time in ('07:00', '08:00', '09:00')),
  is_active boolean not null default true,
  consented_at timestamptz not null,
  unsubscribed_at timestamptz,
  has_password boolean not null default false,
  password_hash text,
  password_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_interest_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  main_interest text not null check (main_interest in ('건강', '돈', '뉴스', '취미', '가족')),
  sub_interest text,
  created_at timestamptz not null default now(),
  unique (user_id, main_interest)
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('건강', '돈', '뉴스', '취미', '가족')),
  source_name text not null,
  source_url text not null,
  sources jsonb not null default '[]'::jsonb,
  raw_text text not null,
  short_summary text,
  action_line text,
  summary_type text not null check (summary_type in ('MUST', 'USEFUL', 'ACTION')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  ai_status text not null default 'pending' check (ai_status in ('pending', 'completed', 'failed')),
  ai_processing_started_at timestamptz,
  summary_status text not null default 'pending' check (summary_status in ('pending', 'processing', 'done', 'failed')),
  published_at timestamptz,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_picks (
  id uuid primary key default gen_random_uuid(),
  pick_date date not null unique,
  generated_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists daily_pick_items (
  id uuid primary key default gen_random_uuid(),
  daily_pick_id uuid not null references daily_picks(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete restrict,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  unique (daily_pick_id, position),
  unique (daily_pick_id, content_item_id)
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  daily_pick_id uuid not null references daily_picks(id) on delete restrict,
  sent_at timestamptz,
  status text not null check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  unique (user_id, daily_pick_id)
);

create table if not exists job_logs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  run_at timestamptz not null default now(),
  status text not null check (status in ('success', 'failed', 'skipped')),
  details text,
  created_at timestamptz not null default now()
);

create table if not exists unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_delivery_time_active on users (delivery_time, is_active) where unsubscribed_at is null;
create index if not exists idx_interest_user_id on user_interest_selections (user_id);
create index if not exists idx_content_status on content_items (approval_status, ai_status, summary_type, published_at desc);
create index if not exists idx_content_slug on content_items (slug);
create index if not exists idx_daily_pick_date on daily_picks (pick_date desc);
create index if not exists idx_email_logs_sent on email_logs (sent_at desc);
create index if not exists idx_job_logs_run_at on job_logs (run_at desc);
create index if not exists idx_unsubscribe_user on unsubscribe_tokens (user_id, used_at);
create index if not exists idx_magic_link_user on magic_link_tokens (user_id, used_at, expires_at desc);
create index if not exists idx_password_reset_user on password_reset_tokens (user_id, used_at, expires_at desc);
