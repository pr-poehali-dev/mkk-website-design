CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.card_transactions (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  phone VARCHAR(32) NOT NULL,
  tx_type VARCHAR(10) NOT NULL,
  method VARCHAR(10) NOT NULL,
  amount INTEGER NOT NULL,
  target VARCHAR(64),
  bank VARCHAR(128),
  status VARCHAR(12) NOT NULL DEFAULT 'processing',
  admin_comment TEXT,
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_tx_phone ON t_p90084086_mkk_website_design.card_transactions(phone);
CREATE INDEX IF NOT EXISTS idx_card_tx_app ON t_p90084086_mkk_website_design.card_transactions(application_id);