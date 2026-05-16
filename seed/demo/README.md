# Demo Account Seed

Creates the read-only demo user and a realistic-looking portfolio so the
dashboard is non-empty for first-time visitors.

## Run

```bash
pnpm seed:demo
```

This seeds:

- User `demo@rizkiandrianto.com` (password `demo1234`) with `is_demo = true`
- **Accounts**: BCA + Sinarmas (bank), Alami (deposit), Dompet (cash)
- **IDX stocks @ Ajaib**: BBCA (5 entry lots), PTBA, BBRI
- **US stocks**: AAPL & TSLA @ Nanovest, NVDA @ Ajaib Crypto
- **Crypto**: BTC ×2 (Binance + Indodax), ETH @ Binance, SOL @ Indodax
- **Gold**: 2 lots @ Nanovest, 2 lots @ Pegadaian
- **Sales**: 2 stock (BBCA, BBRI), 2 crypto (BTC, ETH), 2 gold
- **Transactions**: 2 deposits (BCA, Sinarmas), 1 transfer (Sinarmas→BCA),
  1 withdrawal (Sinarmas)

All inserts happen inside a single transaction — partial seeds never end up
in the DB.

## Idempotency

The seed is idempotent on the **user row**: if `demo@rizkiandrianto.com` already
exists it does not re-insert sample data (it only flips `is_demo` to `true`
if needed). For a fresh seed, run `pnpm seed:demo:reset --yes` first to
remove the user — then run `pnpm seed:demo` again.

## Reset (delete the demo user + all data)

```bash
pnpm seed:demo:reset         # dry-run — prints per-table row counts, no writes
pnpm seed:demo:reset --yes   # delete the user row; CASCADE wipes everything
```

A single `DELETE FROM users WHERE id = …` is issued; every user-owned table
has `ON DELETE CASCADE`, so all accounts, holdings, locations, sales,
transactions, and snapshots disappear with it.

Safety: refuses to run if a user with that email exists but has
`is_demo = false`, to prevent deleting a real account that happens to share
the email.

## Behavior of the demo account

- Server middleware (`src/proxy.ts`) returns `401 Unauthorized` on
  `POST/PUT/PATCH/DELETE` to `/api/*` when `session.user.isDemo === true`.
- Client wrapper (`src/lib/queries/useGuardedMutation.ts`) opens a
  "Demo account" notice dialog before any mutation is fired.
- `GET /api/*`, `/api/auth/*`, and `/api/register` remain reachable.
