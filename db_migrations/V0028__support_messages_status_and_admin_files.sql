ALTER TABLE t_p90084086_mkk_website_design.support_messages
  ADD COLUMN IF NOT EXISTS admin_file_urls TEXT[] DEFAULT '{}';

UPDATE t_p90084086_mkk_website_design.support_messages SET status = 'in_progress' WHERE status = 'answered' AND admin_reply IS NOT NULL AND admin_reply <> '';
