CREATE TABLE IF NOT EXISTS t_p90084086_mkk_website_design.news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON t_p90084086_mkk_website_design.news (is_published, published_at DESC);
