ALTER TABLE t_p90084086_mkk_website_design.chat_sessions
    ADD COLUMN IF NOT EXISTS operator_requested_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS wait_notice_sent BOOLEAN NOT NULL DEFAULT false;
