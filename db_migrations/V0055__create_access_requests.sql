CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.access_requests (
  id serial PRIMARY KEY,
  ref_number varchar(50) NOT NULL,
  full_name varchar(255) NOT NULL,
  passport varchar(20) NOT NULL,
  snils varchar(20) NOT NULL,
  selfie_url text NOT NULL,
  new_password_hash varchar(128) NOT NULL,
  email varchar(255) NULL,
  status varchar(20) NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);