INSERT INTO site_settings (key, value)
VALUES ('company_logo_url', 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/bucket/5cc45d60-1096-44b3-9146-5501803b6898.jpg')
ON CONFLICT (key) DO NOTHING;