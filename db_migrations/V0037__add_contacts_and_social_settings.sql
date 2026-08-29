INSERT INTO site_settings (key, value) VALUES
  ('company_phone', '8 499 961-07-36'),
  ('company_email', 'zaymy.plyus@bk.ru'),
  ('social_telegram', 'https://t.me/zaymiplus263'),
  ('social_vk', ''),
  ('social_ok', ''),
  ('social_max', '')
ON CONFLICT (key) DO NOTHING;