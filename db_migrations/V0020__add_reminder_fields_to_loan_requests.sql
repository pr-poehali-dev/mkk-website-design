ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS money_sent_at timestamp with time zone NULL;