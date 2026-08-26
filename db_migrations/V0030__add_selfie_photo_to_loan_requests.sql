ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS selfie_photo_url TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS selfie_photo_status VARCHAR(20) DEFAULT 'pending';