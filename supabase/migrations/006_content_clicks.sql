-- ═══════════════════════════════════════════════════════════════════════════════
-- 세줄아침: 콘텐츠 클릭 추적 (쿠팡파트너스 수수료 BM 분석용)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Content Clicks (아웃바운드 링크 클릭 추적) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS content_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content_item_id uuid REFERENCES content_items(id) ON DELETE SET NULL,
  daily_pick_id uuid REFERENCES daily_picks(id) ON DELETE SET NULL,
  link_type text NOT NULL CHECK (link_type IN ('coupang', 'source', 'external', 'internal')),
  target_url text NOT NULL,
  referrer_path text,  -- 클릭이 발생한 페이지
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_clicks_created ON content_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_clicks_type ON content_clicks (link_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_clicks_content ON content_clicks (content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_clicks_session ON content_clicks (session_id);

-- ─── User Activity Logs (세줄아침도 동일하게 주요 액션 추적) ────────────────────
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,  -- signup | login | unsubscribe | interest_change | email_open | content_view
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_logs (created_at DESC);
