INSERT INTO site_settings (key, value)
VALUES ('cabinet_banner_url', 'https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/bucket/083e73a5-02b5-45f9-83b9-3ad59a8453f0.jpg')
ON CONFLICT (key) DO NOTHING;