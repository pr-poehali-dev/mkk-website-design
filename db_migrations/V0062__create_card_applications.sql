CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.card_applications (
  id SERIAL PRIMARY KEY,
  ref_number VARCHAR(50) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  birth_date VARCHAR(32),
  passport VARCHAR(64),
  address TEXT,
  work_place VARCHAR(255),
  income INTEGER,
  requested_limit INTEGER NOT NULL,
  approved_limit INTEGER,
  term_months INTEGER,
  rate_percent NUMERIC(6,2),
  schedule JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  admin_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_applications_phone ON t_p90084086_mkk_website_design.card_applications(phone);
CREATE INDEX IF NOT EXISTS idx_card_applications_status ON t_p90084086_mkk_website_design.card_applications(status);