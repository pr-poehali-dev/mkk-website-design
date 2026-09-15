CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_key VARCHAR(64) UNIQUE NOT NULL,
  client_name VARCHAR(255),
  client_phone VARCHAR(20),
  ref_number VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'bot',
  operator_name VARCHAR(255),
  rating INTEGER,
  rating_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  sender VARCHAR(20) NOT NULL,
  text TEXT,
  file_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, created_at ASC);