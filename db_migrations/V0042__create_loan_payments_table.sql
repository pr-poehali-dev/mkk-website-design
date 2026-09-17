CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.loan_payments (
    id SERIAL PRIMARY KEY,
    ref_number VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_ref_number ON t_p90084086_mkk_website_design.loan_payments(ref_number);
