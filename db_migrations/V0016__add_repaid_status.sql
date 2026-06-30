ALTER TABLE t_p90084086_mkk_website_design.loan_requests
  DROP CONSTRAINT loan_requests_status_check;

ALTER TABLE t_p90084086_mkk_website_design.loan_requests
  ADD CONSTRAINT loan_requests_status_check
  CHECK (status IN ('review', 'approved', 'issued', 'money_sent', 'rejected', 'transfer_error', 'repaid'));