INSERT INTO site_settings (key, value)
VALUES ('company_name', 'КПК «Частные займы плюс»')
ON CONFLICT (key) DO NOTHING;