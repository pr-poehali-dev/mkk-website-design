ALTER TABLE t_p90084086_mkk_website_design.loan_requests
  ADD COLUMN IF NOT EXISTS address_residence TEXT,
  ADD COLUMN IF NOT EXISTS address_registration TEXT,
  ADD COLUMN IF NOT EXISTS work_place TEXT,
  ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS income_doc_url TEXT;
