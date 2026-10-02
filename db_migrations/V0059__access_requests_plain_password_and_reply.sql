ALTER TABLE t_p90084086_mkk_website_design.access_requests ADD COLUMN IF NOT EXISTS new_password_plain varchar(128) NULL;
ALTER TABLE t_p90084086_mkk_website_design.access_requests ADD COLUMN IF NOT EXISTS admin_reply text NULL;
ALTER TABLE t_p90084086_mkk_website_design.access_requests ADD COLUMN IF NOT EXISTS replied_at timestamptz NULL;