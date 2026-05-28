-- Seed owner config settings. Idempotent (ON CONFLICT DO NOTHING) and
-- owner-gated, so it is a no-op until an owner user exists.
-- New years: add rows to the sync VALUES list below.

INSERT INTO app_settings (user_id, key, value, description)
SELECT u.id, k.key, '', k.description
FROM users u
CROSS JOIN (VALUES
  ('sync.2026.sheetId',            'Google Sheet ID untuk year 2026 (string panjang setelah /d/ di URL sheet)'),
  ('sync.2026.sinarmas.range',     'A1 range Sinarmas, cover 5 kolom: Month, Kredit, Debit, Saldo Akhir, Sisa. Contoh: 2026!B3:F14'),
  ('sync.2026.sinarmas.accountId', 'UUID wealth_accounts row untuk Sinarmas'),
  ('sync.2026.bca.range',          'A1 range BCA, sama struktur. Contoh: 2026!H3:L14'),
  ('sync.2026.bca.accountId',      'UUID wealth_accounts row untuk BCA')
) AS k(key, description)
WHERE u.is_owner = true
ON CONFLICT (user_id, key) DO NOTHING;
--> statement-breakpoint
INSERT INTO app_settings (user_id, key, value, description)
SELECT u.id, 'register.enabled', 'true',
       'When false, /api/register returns 403. Empty / true = registration open.'
FROM users u
WHERE u.is_owner = true
ON CONFLICT (user_id, key) DO NOTHING;
