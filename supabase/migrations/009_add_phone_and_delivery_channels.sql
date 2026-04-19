-- 카카오톡 알림톡 발송을 위한 휴대폰번호 + 채널 선택 컬럼 추가
-- 2026-04-19: 가입 폼에 받는 방법(카톡/이메일) 토글 도입

alter table users
  add column if not exists phone text,
  add column if not exists delivery_kakao boolean not null default false,
  add column if not exists delivery_email boolean not null default true;

-- 휴대폰번호 인덱스 (알림톡 cron이 phone 으로 조회할 때 사용)
create index if not exists idx_users_phone_active
  on users (phone)
  where phone is not null and unsubscribed_at is null and is_active;

-- 휴대폰번호는 한 사람당 하나만 (중복 방지)
-- NULL 은 중복 허용 (이메일만 받는 사용자)
create unique index if not exists uniq_users_phone
  on users (phone)
  where phone is not null;
