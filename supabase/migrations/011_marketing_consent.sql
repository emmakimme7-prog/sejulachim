-- 광고성 정보 수신 동의 타임스탬프 (정보통신망법 제50조 대응)
-- 2026-04-01 KISA 7차 안내서 기준: "광고성 정보 수신동의" 별도 항목 필수.
-- 유저가 가입 시 동의한 시점을 기록하고, 철회 시 NULL 처리한다.

alter table users
  add column if not exists marketing_consent_at timestamptz;

-- 기존 가입자는 consented_at 시점에 수신 동의한 것으로 간주(서비스 특성상
-- 가입 = 매일 소식 수신). 향후 신규 가입자는 별도 체크박스로 관리.
update users
  set marketing_consent_at = consented_at
  where marketing_consent_at is null
    and consented_at is not null;

create index if not exists idx_users_marketing_consent
  on users (marketing_consent_at)
  where marketing_consent_at is not null;
