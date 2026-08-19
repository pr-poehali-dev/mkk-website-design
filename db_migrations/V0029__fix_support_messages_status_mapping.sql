UPDATE t_p90084086_mkk_website_design.support_messages SET status = 'closed' WHERE status = 'in_progress' AND admin_reply IS NOT NULL AND admin_reply <> '';
