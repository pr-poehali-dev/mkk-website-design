ALTER TABLE loan_requests
  ADD COLUMN IF NOT EXISTS passport_photo_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS registration_photo_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS income_doc_status VARCHAR(20) DEFAULT 'pending';