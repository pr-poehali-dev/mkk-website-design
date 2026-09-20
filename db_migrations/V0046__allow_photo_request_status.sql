ALTER TABLE loan_requests DROP CONSTRAINT loan_requests_status_check;
ALTER TABLE loan_requests ADD CONSTRAINT loan_requests_status_check
  CHECK (status::text = ANY (ARRAY['review','approved','issued','money_sent','rejected','transfer_error','repaid','photo_request']::text[]));