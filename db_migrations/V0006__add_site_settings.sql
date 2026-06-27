CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p90084086_mkk_website_design.site_settings (key, value) VALUES ('maintenance_banner', 'false')
ON CONFLICT (key) DO NOTHING;