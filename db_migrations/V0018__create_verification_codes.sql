CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.verification_codes (
  id serial PRIMARY KEY,
  email text NOT NULL,
  code varchar(6) NOT NULL,
  purpose varchar(20) NOT NULL,
  ref_number varchar(20),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_lookup
  ON t_p90084086_mkk_website_design.verification_codes (email, purpose, created_at DESC);
