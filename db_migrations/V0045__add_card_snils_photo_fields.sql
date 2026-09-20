ALTER TABLE loan_requests
  ADD COLUMN IF NOT EXISTS card_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS card_photo_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS snils_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS snils_photo_status VARCHAR(20) DEFAULT 'pending';