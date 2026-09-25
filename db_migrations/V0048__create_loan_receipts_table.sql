CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.loan_receipts (
    id SERIAL PRIMARY KEY,
    ref_number VARCHAR(20) NOT NULL,
    receipt_number VARCHAR(30) NOT NULL,
    receipt_type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    html TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_receipts_ref_number ON t_p90084086_mkk_website_design.loan_receipts(ref_number);