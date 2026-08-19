ALTER TABLE t_p90084086_mkk_website_design.support_messages
  ADD COLUMN IF NOT EXISTS ref_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT '{}';
