# Sync Balance (Immutable Journal)

Branch: `feat/sync-balance` cut from `develop`.

## Context

Owner maintains a Google Sheet per year untuk track Kredit / Debit / Saldo Akhir / Sisa bulanan dari 2 bank: Sinarmas & BCA. Saat ini reconcile saldo DB vs sheet itu manual. Goal: tombol **Sync Balance**, app fetch latest "Saldo Akhir" per bank dari sheet via Google Sheets API, diff sama `wealthAccounts.balance`, tampilkan preview, lalu (on confirm) bikin **transaction adjustment** (topup atau withdrawal, description `"Balance adjustment"`) untuk tiap diff.

**Prinsip "immutable journal"**: jangan pernah overwrite kolom `balance` langsung. Sumber kebenaran = `transactions`. Existing transaction insert flow udah handle balance increment + snapshot cascade — sync feature ini tinggal trigger flow yang sama dengan data dari sheet.

Feature ini owner-only.

## Locked decisions

| Keputusan       | Pilihan                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sheets auth     | **GCP service account** (base64-encoded JSON di env). Sheet di-share ke service account email tiap tahun.                                |
| Config storage  | **Generic `appSettings` key-value table**. Migration seed default keys dgn empty value. Generic settings page untuk manage semua config. |
| Target month    | **Latest non-zero** auto-detect per bank.                                                                                                |
| Adjustment date | Default today, user override di preview.                                                                                                 |
| Owner gate      | **`users.isOwner` boolean** + `requireOwner()` helper.                                                                                   |

## Tracker

- [ ] **SB.1** Schema: add `users.isOwner` boolean + new `app_settings` key-value table + drizzle generate/migrate
- [ ] **SB.2** Custom seed migration: insert empty `sync.2026.*` keys via `INSERT...SELECT FROM users WHERE is_owner=true ON CONFLICT DO NOTHING`
- [ ] **SB.3** Generic settings helper `src/lib/settings/index.ts`: `getSetting / getSettings / upsertSetting / listSettings / deleteSetting`
- [ ] **SB.4** Auth: `requireOwner()` helper di `src/lib/auth.ts` + augment session callback dgn `isOwner`
- [ ] **SB.5** API `/api/settings`: GET (optional `?prefix=`), POST upsert, DELETE — all owner-gated
- [ ] **SB.6** UI `/settings` page (generic key-value editor): list rows grouped by prefix, edit inline, "Tambah config" modal, delete confirm
- [ ] **SB.7** Sheets client `src/lib/sync/sheets-client.ts` + env wiring (decode base64 JSON, JWT auth, `readSheetRange`)
- [ ] **SB.8** Pure helpers `parse-saldo.ts` + `diff.ts` + unit tests
- [ ] **SB.9** API `/api/sync-balance/preview`: load config, fetch sheet, parse, diff, return preview
- [ ] **SB.10** API `/api/sync-balance/commit`: race-validate `expectedDbBalance`, create transactions (copy pattern from `src/app/api/transactions/route.ts:21-67` inline), recompute snapshots
- [ ] **SB.11** UI `/sync-balance` page: config check warning → Run Sync → preview table + date picker → Confirm sync → toast + invalidate queries
- [ ] **SB.12** Nav: tambah link "Settings" + "Sync Balance" conditional render kalau `session.user.isOwner`
- [ ] **SB.13** Docs: update `plan/per-page-api.md` "Required APIs per Page" — tambah `/settings` + `/sync-balance`

## Data model

### `src/db/schema.ts` — add to `users`

```ts
isOwner: boolean("is_owner").notNull().default(false),
```

### `src/db/schema.ts` — new generic settings table

```ts
export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull().default(""),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => ({ uniqUserKey: unique().on(t.userId, t.key) }))
```

Generic — fitur lain bisa pakai tabel yang sama (`portfolio.refreshIntervalMin`, `notifications.email`, dll).

### Migration order

1. `pnpm drizzle-kit generate` untuk `users.isOwner` + `app_settings`.
2. Run migration.
3. One-time SQL: `UPDATE users SET is_owner = true WHERE email = 'rizki.andrianto@nanovest.io';`
4. **Custom seed migration** untuk default sync config keys. `pnpm drizzle-kit generate --custom --name seed_sync_settings`, isi SQL:

```sql
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
```

Idempotent. Tahun depan: bikin migration baru dengan key `sync.2027.*`.

## Settings helper API

### `src/lib/settings/index.ts` (new)

```ts
export async function getSetting(userId: string, key: string): Promise<string | null>
export async function getSettings(userId: string, keys: string[]): Promise<Record<string, string>>
export async function upsertSetting(userId: string, key: string, value: string, description?: string): Promise<void>
export async function listSettings(userId: string, prefix?: string): Promise<AppSetting[]>
export async function deleteSetting(userId: string, key: string): Promise<void>
```

Convenience untuk sync feature:
```ts
export async function getSyncConfig(userId: string, year: number) {
  const keys = ['sheetId', 'sinarmas.range', 'sinarmas.accountId', 'bca.range', 'bca.accountId']
    .map(k => `sync.${year}.${k}`)
  const map = await getSettings(userId, keys)
  // throw kalau ada yg empty → caller return 412
  return { sheetId: ..., sinarmas: { range, accountId }, bca: { range, accountId } }
}
```

## Auth helper

### `src/lib/auth.ts` — add

```ts
export async function requireOwner() {
  const session = await auth()
  if (!session?.user?.id) throw new Response("Unauthorized", { status: 401 })
  const [user] = await db.select({ isOwner: users.isOwner })
    .from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user?.isOwner) throw new Response("Forbidden", { status: 403 })
  return session
}
```

Plus augment session callback supaya `session.user.isOwner` ke-expose ke client (untuk conditional nav).

## Sheets client

### Install
```bash
pnpm add googleapis
```

### `src/lib/sync/sheets-client.ts` (new)

- Decode `process.env.GOOGLE_SERVICE_ACCOUNT_JSON` (base64) → `JSON.parse`.
- `google.auth.JWT` dgn scope `https://www.googleapis.com/auth/spreadsheets.readonly`.
- Export `readSheetRange(sheetId: string, range: string): Promise<string[][]>` (return `values`).

### `src/lib/sync/parse-saldo.ts` (new, pure)

- `pickLatestNonZeroSaldoAkhir(rows: string[][], saldoColIndex: number): { rowIndex, monthLabel, saldoAkhir } | null`
- Iterate dari row terakhir ke pertama, parse pakai helper mirip `parseNumber()` di `scripts/import-snapshots.ts:29-41` (strip "Rp.", spasi, replace `,` → `.`).

### `src/lib/sync/diff.ts` (new, pure)

- `computeDiff({ accountId, accountName, dbBalance, sheetBalance }) → { ..., delta, action: 'topup' | 'withdrawal' | 'no-op' }`

## API routes

### `src/app/api/settings/route.ts` (new — generic)

- `GET ?prefix=sync.` → list user's `appSettings` filtered by prefix.
- `POST` → upsert `{ key, value, description? }`.
- `DELETE` → body `{ key }`.
- All gated via `requireOwner()`.

### `src/app/api/sync-balance/preview/route.ts` (new)

1. `requireOwner()`.
2. `getSyncConfig(userId, year ?? currentYear)`. Throw **412 Precondition Failed** kalau key kosong → FE redirect ke `/settings`.
3. Read Sinarmas + BCA range parallel.
4. Saldo Akhir kolom = index 3 dari range (4th of 5: Month, Kredit, Debit, **SaldoAkhir**, Sisa).
5. `pickLatestNonZeroSaldoAkhir` per bank.
6. Load `wealthAccounts.balance` untuk 2 akun.
7. `computeDiff` per akun.
8. Return `{ year, asOf, diffs: [...] }`.

### `src/app/api/sync-balance/commit/route.ts` (new)

`POST` body `{ year, adjustmentDate: 'YYYY-MM-DD', diffs: [{ accountId, expectedDbBalance, sheetBalance }] }`.

Inside `db.transaction()`:
1. `requireOwner()`.
2. Re-verify `wealthAccounts.balance === expectedDbBalance` per row → 409 kalau mismatch.
3. Untuk tiap `action !== 'no-op'`:
   - `topup`: insert `transactions` dgn `toAccountId`, `amount = |delta|`, `description = "Balance adjustment"`, `date = adjustmentDate`.
   - `withdrawal`: insert dgn `fromAccountId`, `amount = |delta|`.
   - Apply balance increment + `recomputeSnapshotsForward()` — **copy inline** dari `src/app/api/transactions/route.ts:35-64`. Jangan refactor existing route (CLAUDE.md: hindari abstraksi belum perlu).
4. Return created transactions.

## UI

### `src/app/(dashboard)/settings/page.tsx` (new — generic)

```tsx
// Required APIs:
//   GET    /api/settings
//   POST   /api/settings
//   DELETE /api/settings
```

Server: `requireOwner()`. Client (TanStack Query):
- Tabel: Key | Value | Description | Updated At | Actions
- Inline edit value → POST.
- "Tambah config" modal: key/value/description → POST.
- Delete dgn confirm dialog.
- Group by first dot-segment (collapsible): `sync.2026.*`, dst.

Generic — bisa dipake feature lain.

### `src/app/(dashboard)/sync-balance/page.tsx` (new)

```tsx
// Required APIs:
//   POST /api/sync-balance/preview
//   POST /api/sync-balance/commit
//   GET  /api/settings?prefix=sync.
```

Server: `requireOwner()`. Client:
- **Config check** atas: tampilin 5 keys `sync.<year>.*`. Kalau ada empty → warning + tombol "Configure" → `/settings`.
- **Sync action**: tombol "Run Sync" → `useMutation` `/api/sync-balance/preview`.
- **Preview table**:
  | Account | Sheet Month | Sheet Saldo | DB Saldo | Delta | Action |
  - Date picker (default today, max today, min 1 Jan current year).
  - "Confirm sync" → `useMutation` `/api/sync-balance/commit`. Disable kalau semua row `no-op`.
- On success: toast + invalidate keys (accounts, balance, transactions, snapshots — per `plan/component-loading.md`).

### Navigation

Tambah "Settings" + "Sync Balance" di dashboard nav, conditional render kalau `session.user.isOwner`.

## Env

### Tambah ke `.env.local`

```
GOOGLE_SERVICE_ACCOUNT_JSON=<base64-encoded JSON key>
```

### Cara generate base64 service account JSON

1. Buka [Google Cloud Console](https://console.cloud.google.com) → create project (atau pakai existing).
2. **APIs & Services** → **Library** → enable **Google Sheets API**.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**. Name: misal `wealth-sync-bot`. Skip role assignment.
4. Click row service account → tab **Keys** → **Add Key** → **Create new key** → **JSON**. Download (misal `~/Downloads/wealth-sync-bot-abc123.json`).
5. Catat email service account: `wealth-sync-bot@<project>.iam.gserviceaccount.com`.
6. Buka Google Sheet tahun aktif → **Share** → paste email service account → role **Viewer** → uncheck "Notify". Repeat untuk sheet tahun lain.
7. Generate base64 (macOS):
   ```bash
   base64 -i ~/Downloads/wealth-sync-bot-abc123.json | tr -d '\n' | pbcopy
   ```
   Linux:
   ```bash
   base64 -w 0 ~/Downloads/wealth-sync-bot-abc123.json
   ```
8. Paste ke `.env.local`:
   ```
   GOOGLE_SERVICE_ACCOUNT_JSON=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
   ```
9. Restart dev server (env reload).
10. Hapus file JSON dari disk: `rm ~/Downloads/wealth-sync-bot-abc123.json`. Simpan original cuma di password manager.

Verify `.env.local` di `.gitignore`.

## Critical files

**Modify:**
- `src/db/schema.ts` — `users.isOwner`, `app_settings`
- `src/lib/auth.ts` — `requireOwner()`, session callback `isOwner`
- `plan/per-page-api.md` — Required APIs tabel

**Reference (read, don't change):**
- `src/app/api/transactions/route.ts:21-67` — transaction insert pattern (copy inline)
- `src/lib/snapshot.ts` — `appDateStr`, `recomputeSnapshotsForward`
- `scripts/import-snapshots.ts:29-41` — `parseNumber` style

**New:**
- `src/lib/settings/index.ts`
- `src/lib/sync/sheets-client.ts`
- `src/lib/sync/parse-saldo.ts` + `.test.ts`
- `src/lib/sync/diff.ts` + `.test.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/sync-balance/preview/route.ts`
- `src/app/api/sync-balance/commit/route.ts`
- `src/app/(dashboard)/settings/page.tsx` + co-located client
- `src/app/(dashboard)/sync-balance/page.tsx` + co-located client
- `drizzle/<timestamp>_seed_sync_settings.sql`

## Verification

**E2E manual:**
1. GCP setup (lihat Env section). Share sheet 2026 ke service account email.
2. Migrate. SQL: `UPDATE users SET is_owner = true WHERE email = '...'`. Run seed migration.
3. `/settings` → liat 5 row `sync.2026.*` empty. Isi: `sheetId`, `sinarmas.range` (e.g., `2026!B3:F14`), `sinarmas.accountId` (UUID Sinarmas), same untuk BCA.
4. `/sync-balance` → "Run Sync" → preview menampilkan Sinarmas latest non-zero (Mei: Rp 62.941.035), BCA (Mei: Rp 10.871.618).
5. Edit Sheet Saldo Akhir Mei Sinarmas +Rp 100.000 → refresh preview → delta +100.000, action `topup`.
6. Pilih date (today), Confirm → toast → cek `transactions` ada row `description='Balance adjustment'`, `toAccountId=sinarmas`, `amount=100000`. Cek `wealthAccounts.balance` naik. Cek `accountBalanceSnapshots` recomputed.
7. Run preview ulang → semua `no-op`, Confirm disabled.
8. Test "Tambah config" di `/settings`: tambah key `test.foo` value `bar` → muncul → edit → delete → hilang.

**Auth gate:**
- Sign in sebagai user kedua via Google → `is_owner=false` by default → akses `/settings` & `/sync-balance` → 403/redirect. API curl → 403.

**Unit tests:**
- `parse-saldo.test.ts`: fixture mirror screenshot. Latest non-zero. All-zero null. Decimal koma. Quote-wrapped.
- `diff.test.ts`: topup/withdrawal/no-op edge cases.

## Risks & mitigations

- **Service account key leak** → `.env.local` di gitignore, base64-encoded buat sedikit obfuscate. File JSON download di-rm. Rotate via "Add Key" + revoke old.
- **Sheet structure drift** (kolom Saldo Akhir pindah) → range disimpan di `appSettings`, edit via `/settings` tanpa deploy. Range MUST 5 kolom (Saldo Akhir = index 3).
- **Race condition** (manual transaction di tab lain antara preview & confirm) → commit route re-validates `expectedDbBalance` → 409 kalau berubah. FE re-fetch.
- **Missing config** (lupa isi setting) → preview 412 + structured error. UI link "Configure" ke `/settings`.
- **Service account belum di-share** ke sheet → Sheets API 403. Wrap di sheets-client, return error jelas: "Service account belum punya akses ke sheet `<id>`. Share `<email>` sebagai Viewer."
