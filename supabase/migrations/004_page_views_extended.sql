-- Extended analytics columns
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS country varchar(10),
  ADD COLUMN IF NOT EXISTS device_type varchar(20),
  ADD COLUMN IF NOT EXISTS language varchar(20),
  ADD COLUMN IF NOT EXISTS screen_width int,
  ADD COLUMN IF NOT EXISTS utm_source varchar(200),
  ADD COLUMN IF NOT EXISTS utm_medium varchar(200),
  ADD COLUMN IF NOT EXISTS utm_campaign varchar(200);

CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views (country);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON page_views (device_type);
