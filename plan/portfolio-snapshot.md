# Daily Portfolio Value Snapshot

## Context

Saat ini sistem sudah menyimpan **per-account cash balance snapshot** (`account_balance_snapshots`) yang di-recompute saat ada transaksi. Tapi belum ada catatan **total portfolio value per hari** (cash + stock + crypto + gold) yang bergerak mengikuti harga pasar.

Tujuan: setiap kali job market price update (`POST /api/market/prices/update`) jalan, hitung total portfolio value untuk setiap user → upsert ke tabel baru, satu row per `(user, date)`. Kalau price update jalan dua kali di tanggal yang sama (mis. 10 pagi & 11 malam), row tanggal itu di-replace, bukan ditambah. Hasilnya bisa dipakai untuk chart historis portfolio.

Design choices (sudah dikonfirmasi):
- **Breakdown + total** disimpan (cash, stock, crypto, gold, total) untuk fleksibilitas chart.
- **Today-only**: tanggal selalu hari ini Asia/Jakarta. Holdings tidak punya time-series jadi backfill tanggal lampau dengan harga sekarang akan misleading.

## Working Agreement

- **Branch**: `feat/portfolio-snapshot` (cut dari `develop`).
- **Per sub-step di tracker = 1 commit**. Setelah tiap sub-step (atau group yang berkaitan), AI **stop dan tawarkan commit + test**. Jangan lanjut tanpa konfirmasi user.
- Test pass → lanjut. Test fail → fix dulu, baru commit.
- Plan ini independen dari Stage 1/2 — boleh paralel.

---

## Files to Modify / Create

### 1. `src/db/schema.ts` — add table

Tambahkan `portfolioValueSnapshots` mengikuti pola `accountBalanceSnapshots` (line 221-237):

```ts
export const portfolioValueSnapshots = pgTable(
  "portfolio_value_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD (Asia/Jakarta)
    cashValue:   numeric("cash_value",   { precision: 20, scale: 4 }).notNull().default("0"),
    stockValue:  numeric("stock_value",  { precision: 20, scale: 4 }).notNull().default("0"),
    cryptoValue: numeric("crypto_value", { precision: 20, scale: 4 }).notNull().default("0"),
    goldValue:   numeric("gold_value",   { precision: 20, scale: 4 }).notNull().default("0"),
    totalValue:  numeric("total_value",  { precision: 20, scale: 4 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uq_portfolio_snapshot_user_date").on(t.userId, t.date)]
);
```

Semua nilai disimpan dalam **IDR** (sama seperti `assetPrices` yang sudah dikonversi).

### 2. `src/lib/portfolioSnapshot.ts` — new file

Pattern mirip `src/lib/snapshot.ts`. Export:

- `computePortfolioForUser(tx, userId, date)`
  - **cashValue**: `SUM(wealthAccounts.balance) WHERE userId = $1`
  - **stockValue**: `SUM(stockHoldings.quantity * assetPrices.price) JOIN assetPrices ON ticker WHERE userId = $1` (LEFT JOIN + COALESCE(price, 0) untuk holding tanpa price)
  - **cryptoValue**: `SUM(cryptoHoldings.quantity * assetPrices.price) JOIN assetPrices ON symbol WHERE userId = $1`
  - **goldValue**: `SUM(goldHoldings.weight * assetPrices.price) WHERE assetPrices.ticker = 'XAU' AND userId = $1`
  - Total = sum semuanya. 4 query paralel (Promise.all).
- `upsertPortfolioSnapshot(tx, userId, date)`
  - Insert + onConflictDoUpdate pada `uq_portfolio_snapshot_user_date`. Set semua kolom value + `updatedAt`.

Reuse `appDateStr()` dari `src/lib/snapshot.ts:22`.

### 3. `src/app/api/market/prices/update/route.ts` — trigger snapshot

Setelah seluruh blok price update selesai (setelah line 212, sebelum return):

```ts
const dateStr = appDateStr(new Date())
let snapshotsTouched = 0
try {
  // userIds = UNION distinct user_id dari wealth_accounts + stock_holdings + crypto_holdings + gold_holdings
  await db.transaction(async (tx) => {
    for (const { id } of userIds) {
      await upsertPortfolioSnapshot(tx, id, dateStr)
      snapshotsTouched++
    }
  })
} catch (e) {
  console.warn('[price-update] portfolio snapshot failed', e)
}
```

Tambah `snapshotsTouched` ke response JSON. Snapshot best-effort — jangan rollback price update kalau gagal.

### 4. `src/app/api/portfolio-snapshots/route.ts` — new GET endpoint

Mirror `src/app/api/account-snapshots/route.ts`. Session auth, return rows untuk current user, ordered `date asc`. Field: `date, cashValue, stockValue, cryptoValue, goldValue, totalValue, updatedAt`.

### 5. `drizzle/0002_portfolio_value_snapshots.sql` — migration

`pnpm db:generate` → verify SQL:
- `CREATE TABLE portfolio_value_snapshots ...`
- `CREATE UNIQUE INDEX uq_portfolio_snapshot_user_date ON portfolio_value_snapshots (user_id, date)`
- Cascade FK ada.

---

## Existing Code to Reuse

| What | Where |
|---|---|
| Date formatting (Asia/Jakarta YYYY-MM-DD) | `appDateStr()` di `src/lib/snapshot.ts:22` |
| Upsert pattern w/ unique index | `recomputeSnapshot()` di `src/lib/snapshot.ts:61` |
| Price update flow & API-key check | `src/app/api/market/prices/update/route.ts:10-13`, `106-214` |
| GET endpoint pattern (session auth) | `src/app/api/account-snapshots/route.ts` |
| Drizzle `DbOrTx` type | `src/lib/snapshot.ts:7` |

## Caveats

- **Holdings = current state**: snapshot pakai quantity holdings *sekarang*. Today-only constraint ada karena itu.
- **Multiple runs per hari**: upsert (replace + updatedAt).
- **User tanpa holdings**: tetap snapshot (totalValue = cash saja). Skip hanya kalau user tidak punya wealth_account dan holdings sama sekali.
- **Ticker mapping**: stocks → `assetPrices.ticker = stockHoldings.ticker`; crypto → `assetPrices.ticker = cryptoHoldings.symbol`; gold → `assetPrices.ticker = 'XAU'`. Pakai LEFT JOIN + COALESCE supaya holding tanpa price contribution = 0.
- **No frontend changes** in scope. GET endpoint disiapkan untuk chart di future PR.

## Verification

1. **Migration**: `npm run db:generate` → SQL correct. `npm run db:migrate` → table exists.
2. **Sanity check**: SQL manual untuk 1 user — `cashValue + stockValue + cryptoValue + goldValue ≈ totalValue` di DashboardSummary saat ini.
3. **E2E**: `curl -X POST -H "x-api-key: $INTERNAL_API_KEY" http://localhost:3000/api/market/prices/update` → response punya `snapshotsTouched > 0`. DB: `SELECT * FROM portfolio_value_snapshots WHERE date = '<today>'`. Run kedua kalinya: row count tetap, `updatedAt` berubah.
4. **GET endpoint**: login, hit `/api/portfolio-snapshots` → array berisi snapshot.
5. **Timezone**: trigger jam 23:30 WIB (UTC sudah next day) → `date` row = tanggal WIB hari ini, bukan UTC.

---

## Tracker

- [ ] **Phase PS.1** — Add `portfolioValueSnapshots` ke `src/db/schema.ts`
- [ ] **Phase PS.2** — Generate migration (`pnpm db:generate`), review SQL
- [ ] **Phase PS.3** — Run migration di dev DB (`pnpm db:migrate`)
- [ ] **Phase PS.4** — Create `src/lib/portfolioSnapshot.ts` (computePortfolioForUser + upsertPortfolioSnapshot)
- [ ] **Phase PS.5** — Wire trigger di `src/app/api/market/prices/update/route.ts`
- [ ] **Phase PS.6** — Create `src/app/api/portfolio-snapshots/route.ts` (GET endpoint)
- [ ] **Phase PS.7** — E2E test: trigger price update, verify DB rows, verify upsert behavior, verify timezone
- [ ] **Phase PS.8** — Open PR ke `develop`

Each sub-step = 1 commit + user testing gate. AI berhenti dan tawarkan commit setelah tiap phase.
