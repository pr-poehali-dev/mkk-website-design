INSERT INTO site_settings (key, value)
VALUES ('company_inn', '220038299987')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value)
VALUES ('company_ogrn', '0092800992828288')
ON CONFLICT (key) DO NOTHING;