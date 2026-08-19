CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.notifications (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  ref_number VARCHAR(20),
  type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_phone ON t_p90084086_mkk_website_design.notifications (phone, created_at DESC);
