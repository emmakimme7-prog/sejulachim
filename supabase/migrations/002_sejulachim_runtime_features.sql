alter table users
  add column if not exists nickname text,
  add column if not exists avatar_key text,
  add column if not exists avatar_data_url text,
  add column if not exists font_size_preference text default 'medium';

update users
set
  nickname = coalesce(nullif(nickname, ''), split_part(email::text, '@', 1)),
  avatar_key = coalesce(nullif(avatar_key, ''), 'sun'),
  font_size_preference = coalesce(nullif(font_size_preference, ''), 'medium')
where nickname is null
   or avatar_key is null
   or font_size_preference is null;

alter table content_items
  add column if not exists sub_interest text,
  add column if not exists long_summary text,
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_alt text,
  add column if not exists thumbnail_page_url text,
  add column if not exists thumbnail_author text,
  add column if not exists thumbnail_license text;

create table if not exists site_settings (
  key text primary key,
  title text,
  subtitle text,
  use_image boolean,
  section_title text,
  section_description text,
  image_url text,
  image_alt text,
  image_title text,
  image_description text,
  updated_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete cascade,
  content_slug text,
  created_at timestamptz not null default now()
);

create unique index if not exists favorites_user_content_item_unique
  on favorites (user_id, content_item_id)
  where content_item_id is not null;

create unique index if not exists favorites_user_content_slug_unique
  on favorites (user_id, content_slug)
  where content_slug is not null;

create table if not exists shared_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  share_key text not null unique,
  slugs jsonb not null default '[]'::jsonb,
  nickname text,
  avatar_key text,
  message text,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_viewed_at timestamptz
);

create index if not exists idx_shared_links_user_created_at
  on shared_links (user_id, created_at desc);

create table if not exists shared_comments (
  id uuid primary key default gen_random_uuid(),
  share_key text not null references shared_links(share_key) on delete cascade,
  user_id uuid references users(id) on delete set null,
  parent_id uuid references shared_comments(id) on delete cascade,
  depth smallint not null default 1 check (depth between 1 and 3),
  name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shared_comments_share_created_at
  on shared_comments (share_key, created_at asc);

create index if not exists idx_shared_comments_share_parent_created_at
  on shared_comments (share_key, parent_id, created_at asc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  actor_name text not null,
  title text not null,
  body text not null,
  target_url text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user_created_at
  on notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_read_created_at
  on notifications (user_id, is_read, created_at desc);

alter table email_logs
  add column if not exists mode text;

create index if not exists idx_favorites_user_created_at
  on favorites (user_id, created_at desc);

