-- 이메일 가입 시 6자리 인증 코드 저장소.
-- SNS(카카오/네이버/구글) 가입 + 카카오톡 채널 경로는 모두 OAuth 인증으로
-- 이메일 소유 검증이 되지만 이메일 직접 가입은 별도 검증이 필요함.

create table if not exists email_signup_verifications (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_signup_verifications_email
  on email_signup_verifications (email, created_at desc);
