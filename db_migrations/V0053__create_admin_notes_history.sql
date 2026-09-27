CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.admin_notes_history (
    id SERIAL PRIMARY KEY,
    ref_number VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_notes_history_ref_number ON t_p90084086_mkk_website_design.admin_notes_history(ref_number);