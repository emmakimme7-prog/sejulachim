-- 계정 유형 (email, google, kakao, naver)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'email';
