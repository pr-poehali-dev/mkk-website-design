ALTER TABLE loan_requests
  ADD COLUMN IF NOT EXISTS identify_consent_sms BOOLEAN NOT NULL DEFAULT false;