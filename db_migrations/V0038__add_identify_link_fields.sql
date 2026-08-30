ALTER TABLE loan_requests
  ADD COLUMN IF NOT EXISTS identify_token VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS identify_token_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS identify_submitted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS identify_consent_pd BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identify_consent_transfer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identify_consent_contract BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_requests_identify_token ON loan_requests (identify_token) WHERE identify_token IS NOT NULL;