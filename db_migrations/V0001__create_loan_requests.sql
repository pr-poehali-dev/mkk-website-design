CREATE TABLE t_p90084086_mkk_website_design.loan_requests (
  id            SERIAL PRIMARY KEY,
  ref_number    VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  birth_date    DATE,
  passport      VARCHAR(50),
  passport_by   VARCHAR(255),
  amount        INTEGER NOT NULL,
  days          INTEGER NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'review'
                CHECK (status IN ('review','approved','issued','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON t_p90084086_mkk_website_design.loan_requests (phone);
CREATE INDEX ON t_p90084086_mkk_website_design.loan_requests (status);
