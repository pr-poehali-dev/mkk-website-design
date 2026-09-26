CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.email_log (
    id SERIAL PRIMARY KEY,
    ref_number VARCHAR(50),
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview TEXT,
    source VARCHAR(50) NOT NULL,
    tracking_id VARCHAR(36) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    open_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_email_log_ref_number ON t_p90084086_mkk_website_design.email_log(ref_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_tracking_id ON t_p90084086_mkk_website_design.email_log(tracking_id);