ALTER TABLE t_p90084086_mkk_website_design.loan_requests
  ADD COLUMN IF NOT EXISTS existing_loans_count INTEGER NULL,
  ADD COLUMN IF NOT EXISTS existing_debt_amount INTEGER NULL;