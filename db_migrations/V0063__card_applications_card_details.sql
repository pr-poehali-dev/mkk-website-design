ALTER TABLE t_p90084086_mkk_website_design.card_applications ADD COLUMN IF NOT EXISTS card_number VARCHAR(19);
ALTER TABLE t_p90084086_mkk_website_design.card_applications ADD COLUMN IF NOT EXISTS card_expiry VARCHAR(5);
ALTER TABLE t_p90084086_mkk_website_design.card_applications ADD COLUMN IF NOT EXISTS card_holder VARCHAR(64);