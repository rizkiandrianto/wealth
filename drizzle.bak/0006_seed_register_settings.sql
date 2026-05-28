-- Seed the register.enabled flag for every owner.
-- Default value: 'true' (open registration). Owner can flip via /settings.
-- Idempotent.

INSERT INTO app_settings (user_id, key, value, description)
SELECT u.id, 'register.enabled', 'true',
       'When false, /api/register returns 403. Empty / true = registration open.'
FROM users u
WHERE u.is_owner = true
ON CONFLICT (user_id, key) DO NOTHING;
