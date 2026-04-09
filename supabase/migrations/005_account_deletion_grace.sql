-- 탈퇴 예약 컬럼 추가 (30일 유예 삭제용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 30일 경과한 탈퇴 예약 유저 조회용 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;
