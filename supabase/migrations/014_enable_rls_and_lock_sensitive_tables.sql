-- Lock down public schema tables that currently have no RLS and may expose
-- passwords, token hashes, verification codes, notification data, and logs.
-- The app uses the service-role key on the server, so enabling RLS here does
-- not break normal server-side behavior while closing anonymous/public access.
--
-- 모든 테이블이 autoclip 마이그레이션에서 sj_ prefix로 변경됨.

-- 1. Enable RLS on every application table in public schema.
alter table if exists sj_users enable row level security;
alter table if exists sj_user_interest_selections enable row level security;
alter table if exists sj_content_items enable row level security;
alter table if exists sj_daily_picks enable row level security;
alter table if exists sj_daily_pick_items enable row level security;
alter table if exists sj_email_logs enable row level security;
alter table if exists sj_job_logs enable row level security;
alter table if exists sj_unsubscribe_tokens enable row level security;
alter table if exists sj_magic_link_tokens enable row level security;
alter table if exists sj_password_reset_tokens enable row level security;
alter table if exists sj_site_settings enable row level security;
alter table if exists sj_favorites enable row level security;
alter table if exists sj_shared_links enable row level security;
alter table if exists sj_shared_comments enable row level security;
alter table if exists sj_notifications enable row level security;
alter table if exists sj_content_clicks enable row level security;
alter table if exists sj_user_activity_logs enable row level security;
alter table if exists sj_email_signup_verifications enable row level security;
alter table if exists sj_kakao_logs enable row level security;

-- 2. Explicitly revoke broad table access from anon/authenticated roles.
revoke all on table sj_users from anon, authenticated;
revoke all on table sj_user_interest_selections from anon, authenticated;
revoke all on table sj_content_items from anon, authenticated;
revoke all on table sj_daily_picks from anon, authenticated;
revoke all on table sj_daily_pick_items from anon, authenticated;
revoke all on table sj_email_logs from anon, authenticated;
revoke all on table sj_job_logs from anon, authenticated;
revoke all on table sj_unsubscribe_tokens from anon, authenticated;
revoke all on table sj_magic_link_tokens from anon, authenticated;
revoke all on table sj_password_reset_tokens from anon, authenticated;
revoke all on table sj_site_settings from anon, authenticated;
revoke all on table sj_favorites from anon, authenticated;
revoke all on table sj_shared_links from anon, authenticated;
revoke all on table sj_shared_comments from anon, authenticated;
revoke all on table sj_notifications from anon, authenticated;
revoke all on table sj_content_clicks from anon, authenticated;
revoke all on table sj_user_activity_logs from anon, authenticated;
revoke all on table sj_email_signup_verifications from anon, authenticated;
revoke all on table sj_kakao_logs from anon, authenticated;

-- 3. Re-grant only the minimum read access that is safe to expose publicly.
grant select on table sj_content_items to anon, authenticated;
grant select on table sj_daily_picks to anon, authenticated;
grant select on table sj_daily_pick_items to anon, authenticated;
grant select on table sj_site_settings to anon, authenticated;

-- 4. Public-read policies for non-sensitive content used in pages.
drop policy if exists "public can read approved content items" on sj_content_items;
create policy "public can read approved content items"
  on sj_content_items
  for select
  to anon, authenticated
  using (
    approval_status = 'approved'
    and published_at is not null
    and (summary_status = 'done' or ai_status = 'completed')
  );

drop policy if exists "public can read daily picks" on sj_daily_picks;
create policy "public can read daily picks"
  on sj_daily_picks
  for select
  to anon, authenticated
  using (status = 'ready');

drop policy if exists "public can read daily pick items" on sj_daily_pick_items;
create policy "public can read daily pick items"
  on sj_daily_pick_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from sj_daily_picks dp
      where dp.id = sj_daily_pick_items.daily_pick_id
        and dp.status = 'ready'
    )
  );

drop policy if exists "public can read site settings" on sj_site_settings;
create policy "public can read site settings"
  on sj_site_settings
  for select
  to anon, authenticated
  using (true);

-- 5. Shared links/comments are public-facing content, but only via their own rows.
grant select on table sj_shared_links to anon, authenticated;
grant select on table sj_shared_comments to anon, authenticated;

drop policy if exists "public can read shared links" on sj_shared_links;
create policy "public can read shared links"
  on sj_shared_links
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read shared comments" on sj_shared_comments;
create policy "public can read shared comments"
  on sj_shared_comments
  for select
  to anon, authenticated
  using (true);

-- Everything else stays denied by default because no policy is created.
