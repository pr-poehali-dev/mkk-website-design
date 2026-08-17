CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.support_messages (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email text,
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'new',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_support_messages_status ON t_p90084086_mkk_website_design.support_messages (status, created_at DESC);
