# Plan + Tracker — Wealth App

## Context

Wealth app saat ini murni client-side — semua data tersimpan di `localStorage` via Zustand, belum ada DB, API routes, atau auth sama sekali. Referensi arsitektur diambil dari project excalidraw yang menggunakan Next.js App Router + Drizzle ORM + NextAuth v5.

---

## Phase 1 — Src-Based Restructuring ✅

- [x] Buat folder `src/` di root repo
- [x] Pindahkan `app/` → `src/app/`
- [x] Pindahkan `components/` → `src/components/`
- [x] Pindahkan `lib/` → `src/lib/`
- [x] Pindahkan `hooks/` → `src/hooks/`
- [x] Update `tsconfig.json`: `@/*` → `./src/*`
- [x] Rename `next.config.mjs` → `next.config.ts` dan cleanup (PWA dipertahankan)
- [x] Buat route group `src/app/(auth)/` untuk login & register
- [x] Pindahkan semua pages ke `src/app/(dashboard)/`
- [x] `npm run build` jalan tanpa error setelah restructure

## Phase 2 — Database Setup ✅

- [x] Install dependencies: `drizzle-orm pg @types/pg` dan dev: `drizzle-kit dotenv`
- [x] Buat `drizzle.config.ts` di root
- [x] Buat `src/db/index.ts` (Pool + drizzle instance)
- [x] Buat `src/db/schema.ts` dengan tabel:
  - **Auth tables** (required NextAuth DrizzleAdapter):
    - [x] `users` — id (uuid), name, email, password (nullable), emailVerified, image, createdAt
    - [x] `accounts` — OAuth linking (provider, providerAccountId, userId fk)
    - [x] `sessions` — sessionToken (pk), userId (fk), expires
    - [x] `verificationTokens` — identifier, token, expires
  - **App tables** (pengganti localStorage):
    - [x] `wealth_accounts` — id, userId (fk), name, type, balance, currency, createdAt
    - [x] `transactions` — id, userId (fk), type, amount, fromAccountId, toAccountId, date, note
    - [x] `stock_locations` — id, userId (fk), name
    - [x] `stock_holdings` — id, userId (fk), locationId (fk), ticker, qty, avgPrice, createdAt
    - [x] `stock_sales` — id, userId (fk), holdingId (fk), qty, salePrice, date, realizedPnl
    - [x] `crypto_locations` — id, userId (fk), name
    - [x] `crypto_holdings` — id, userId (fk), locationId (fk), symbol, qty, avgPrice, createdAt
    - [x] `crypto_sales` — id, userId (fk), holdingId (fk), qty, salePrice, date, realizedPnl
    - [x] `daily_balances` — id, userId (fk), date, totalBalance
- [x] Tambah scripts ke `package.json`: `db:generate`, `db:migrate`, `db:push`
- [x] Buat `.env.local` template dengan `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- [ ] Jalankan `pnpm db:push` untuk sync schema ke DB ← **butuh DATABASE_URL valid**

## Phase 3 — Auth Implementation ✅

- [x] Install dependencies: `next-auth@beta @auth/drizzle-adapter bcryptjs`
- [x] Buat `src/lib/auth.ts` (NextAuth v5 config):
  - DrizzleAdapter dengan 4 tabel auth
  - Session strategy: JWT
  - Credentials provider (email + password + bcrypt)
  - Callbacks: `jwt` (simpan `id`), `session` (expose `id`)
  - Custom page: `signIn: "/login"`
- [x] Buat `src/app/api/auth/[...nextauth]/route.ts`
- [x] Buat `src/app/api/register/route.ts` (POST, validasi email unik, hash bcrypt, insert user)
- [x] Buat `src/proxy.ts` (Next.js 16 convention, ex-middleware):
  - Redirect unauthenticated ke `/login`
  - Redirect authenticated away dari `/login` & `/register`

## Phase 4 — Auth Pages ✅

- [x] Buat `src/app/(auth)/layout.tsx` (two-column: left branding, right form)
- [x] Buat `src/app/(auth)/login/page.tsx` (form email+password, `signIn`, error handling, link ke register)
- [x] Buat `src/app/(auth)/register/page.tsx` (form name+email+password, POST `/api/register`, auto-login, link ke login)
- [x] Buat `src/app/providers.tsx` — `SessionProvider`
- [x] Update `src/app/layout.tsx` — wrap dengan `Providers`
- [x] Buat `src/app/(dashboard)/layout.tsx` — check session, redirect ke `/login` jika tidak ada

---

## Phase 5 — Zustand Migration + Bug Fix ✅

> Root cause bug "ga kesimpen": `useAssetStore` adalah custom hook biasa (bukan singleton). Setiap komponen mendapat instance state terpisah — perubahan di `CryptoForm` tidak terlihat di `CryptoPage` sampai page refresh. Solusi: Zustand, yang merupakan singleton global.

- [x] Install `zustand`
- [x] Buat `src/lib/store/useAssetStore.ts` — Zustand store (state & actions sama dengan hook lama)
- [x] `src/lib/useAssetStore.ts` lama dijadikan re-export shim (semua import tidak perlu diubah)
- [x] Fix `DashboardLayout.tsx`: ganti `window.location.pathname` dengan `usePathname()`
- [x] `pnpm build` clean

## Phase 6 — API Routes (CRUD untuk semua entitas) ✅

- [x] `src/app/api/accounts/route.ts` — GET list, POST create
- [x] `src/app/api/accounts/[id]/route.ts` — PATCH update, DELETE
- [x] `src/app/api/transactions/route.ts` — GET list, POST create
- [x] `src/app/api/transactions/[id]/route.ts` — DELETE
- [x] `src/app/api/stock-locations/route.ts` — GET, POST
- [x] `src/app/api/stock-locations/[id]/route.ts` — PATCH, DELETE
- [x] `src/app/api/stocks/route.ts` — GET, POST
- [x] `src/app/api/stocks/[id]/route.ts` — PATCH, DELETE
- [x] `src/app/api/stocks/[id]/sell/route.ts` — POST (DB transaction: update qty + insert sale)
- [x] `src/app/api/crypto-locations/route.ts` — GET, POST
- [x] `src/app/api/crypto-locations/[id]/route.ts` — PATCH, DELETE
- [x] `src/app/api/crypto/route.ts` — GET, POST
- [x] `src/app/api/crypto/[id]/route.ts` — PATCH, DELETE
- [x] `src/app/api/crypto/[id]/sell/route.ts` — POST (DB transaction: update qty + insert sale)
- [x] Semua route: auth check via `auth()` dari `@/lib/auth`
- [x] `pnpm build` clean

## Phase 7 — Connect Store ke Database

- [ ] Update Zustand store: on mount fetch dari server (ganti localStorage read)
- [ ] Setiap mutasi (add/update/delete): call API → update state on success
- [ ] Tambah `loading` dan `error` state ke store
- [ ] Seed default locations per-user (Nanovest, Ajaib, Binance, dll.) jika belum ada
- [ ] Hapus semua localStorage logic
- [ ] `pnpm build` clean

## Phase 8 — Menu Redesign + Sign Out ✅

- [x] Refactor `DashboardLayout.tsx`:
  - Grouped top nav: Dashboard | Finance ▼ | Portfolio ▼ | History | [Nama User ▼]
  - Finance dropdown: Accounts, Transactions
  - Portfolio dropdown: Stocks, Crypto
  - User dropdown: nama user + email + Sign Out
  - Mobile bottom nav: 4 item (Overview, Finance, Portfolio, History)
  - Mobile hamburger: semua item + Sign Out di bawah
  - `signOut({ callbackUrl: '/login' })` dari `next-auth/react`
  - `useSession()` untuk nama & email user
- [x] `pnpm build` clean

---

## Verification Checklist

- [x] `pnpm build` — berhasil tanpa error
- [x] TypeScript check (`npx tsc --noEmit`) — clean
- [ ] Buka `/crypto`, tambah crypto → langsung muncul di list tanpa refresh (Phase 5)
- [ ] Buka `/stocks`, tambah saham → langsung muncul (Phase 5)
- [ ] Refresh page → data masih ada (Phase 7)
- [ ] Login di browser berbeda → data muncul (Phase 7)
- [ ] Sign Out → redirect ke `/login` (Phase 8)
- [ ] Active nav item highlight update saat navigasi (Phase 5/8)
- [ ] Finance dropdown: Accounts & Transactions (Phase 8)
- [ ] Portfolio dropdown: Stocks & Crypto (Phase 8)
- [ ] User dropdown: nama + Sign Out (Phase 8)
- [ ] Mobile bottom nav: 4 item (Phase 8)

---

## Phase 9 — Schema: Asset Prices Table

> Harga terkini saham & crypto tidak disimpan di dalam holding record. Dipisahkan ke tabel `asset_prices` yang nantinya di-populate oleh BE scheduler. Holding hanya menyimpan data beli: qty, averagePrice, tanggal, lokasi.

- [x] Tambah tabel `asset_prices` di `src/db/schema.ts`:
  - `ticker` (text, unique) — e.g. `BBCA`, `BTC`
  - `assetType` (text) — `stock` | `crypto`
  - `name` (text) — nama lengkap asset
  - `price` (numeric 20,4) — harga terkini
  - `currency` (text, default `IDR` untuk saham, `USD` untuk crypto)
  - `updatedAt` (timestamp)
  - **No userId** — tabel global, dipakai semua user
- [x] Hapus kolom `currentPrice` dari `stockHoldings` dan `cryptoHoldings` di schema
- [x] Hapus kolom `name` dari `stockHoldings` (nama saham diambil dari `asset_prices` saat tampil)
- [x] Untuk `cryptoHoldings`: tetap simpan `name` (di-populate saat user input, lihat Phase 10b)
- [x] Update `src/lib/types.ts`:
  - Hapus `currentPrice` dari `StockHolding` dan `CryptoHolding`
  - Hapus `name` dari `StockHolding`
  - Tambah type `AssetPrice { ticker, assetType, name, price, currency, updatedAt }`
- [x] Update Zustand store: tambah `assetPrices: AssetPrice[]` ke state
- [x] Update kalkulasi P&L di store: lookup harga dari `assetPrices` by ticker (return 0 / N/A kalau belum ada data)
- [x] Tambah API route `GET /api/market/prices` → list semua `asset_prices` (dipakai store untuk load harga)
- [ ] `pnpm db:push` setelah schema diupdate ← **jalankan manual**

## Phase 10 — UX Improvements

### 10a — Transfer: Validasi Saldo

**File:** `src/components/TransactionForm.tsx`

- [x] Saat type = transfer atau withdrawal, validasi `amount <= getAccountBalance(fromAccountId)`
- [x] Tampilkan saldo tersedia di bawah dropdown "From account" setelah account dipilih
- [x] Error message: `"Saldo tidak cukup — tersedia: Rp X,xxx"`
- [x] `getAccountBalance` sudah ada di Zustand store, tinggal dipanggil di form

### 10b — Tambah Lokasi via Modal (Stocks & Crypto)

**Files:** `src/components/StockForm.tsx`, `src/components/CryptoForm.tsx`

Saat ini: ada form inline di bawah select untuk tambah lokasi (tidak rapi).
Target: item `"+ Tambah lokasi baru"` di dalam Select dropdown → buka Dialog kecil.

- [x] Buat komponen reusable `LocationPickerSelect.tsx`:
  - Props: `locations[]`, `value`, `onChange(id)`, `onAddLocation(name) => void`
  - `SelectContent`: render semua lokasi + separator + item `"+ Tambah lokasi baru"`
  - Klik item tambah → buka `Dialog` (shadcn `dialog.tsx` sudah ada)
  - Dialog: satu input nama + tombol Simpan / Batal
  - Setelah simpan: `onAddLocation(name)` dipanggil, `value` otomatis berubah ke lokasi baru
- [x] Ganti section tambah lokasi di `StockForm.tsx` → pakai `<LocationPickerSelect />`
- [x] Ganti section tambah lokasi di `CryptoForm.tsx` → pakai `<LocationPickerSelect />`
- [x] Hapus state `showLocationForm` / `newLocationName` dari kedua form

### 10c — Crypto: Auto-complete Nama dari Symbol

**Files:** `src/components/CryptoForm.tsx`, `src/app/api/market/crypto-search/route.ts` (baru)

Saat ini: user harus isi `symbol` dan `name` sendiri.
Target: ketik symbol → nama auto-isi dari CoinGecko.

- [x] Buat `GET /api/market/crypto-search?symbol=BTC`:
  - Fetch ke CoinGecko: `GET https://api.coingecko.com/api/v3/search?query={symbol}`
  - Return: `{ name: string, id: string }` dari hasil pertama yang match symbol persis
  - No API key required untuk free tier
- [x] Update `CryptoForm.tsx`:
  - Setelah user selesai ketik symbol (onBlur), call `/api/market/crypto-search`
  - Auto-isi field `name` jika ditemukan; beri loading indicator kecil
  - Field name tetap bisa diedit manual (fallback)
- [x] Remove input `currentPrice` dari form (field dihapus, Phase 9)

### 10d — History Chart Per Account

**Files:** `src/components/BalanceChart.tsx`, `src/app/(dashboard)/history/page.tsx`

Saat ini: chart hanya tampilkan total balance. `DailyBalance` di store sudah punya `balances: { [accountId]: number }` per account — tinggal divisualisasikan.

- [x] Update `BalanceChart.tsx`:
  - Tambah toggle: "Total" vs "Per Account"
  - Mode "Per Account": satu line per account dengan warna berbeda, legend di bawah
  - Data: `dailyBalances[].balances[accountId]` sudah ada di store
- [x] Update `history/page.tsx`:
  - Pass `accounts` ke `BalanceChart` (cek apakah sudah ada)
  - Opsional: tambah checkbox filter untuk pilih account mana yang ditampilkan

---

## Verification Checklist

- [x] `pnpm build` — berhasil tanpa error
- [x] TypeScript check (`npx tsc --noEmit`) — clean
- [x] Buka `/crypto`, tambah crypto → langsung muncul di list tanpa refresh (Phase 5)
- [x] Buka `/stocks`, tambah saham → langsung muncul (Phase 5)
- [ ] Refresh page → data masih ada (Phase 7)
- [ ] Login di browser berbeda → data muncul (Phase 7)
- [x] Sign Out → redirect ke `/login` (Phase 8)
- [x] Active nav item highlight update saat navigasi (Phase 5/8)
- [x] Finance dropdown: Accounts & Transactions (Phase 8)
- [x] Portfolio dropdown: Stocks & Crypto (Phase 8)
- [x] User dropdown: nama + Sign Out (Phase 8)
- [x] Mobile bottom nav: 4 item (Phase 8)
- [x] Transfer melebihi saldo → error ditampilkan (Phase 10a)
- [x] Tambah lokasi via modal di dalam Select (Phase 10b)
- [x] Ketik symbol crypto → nama auto-isi (Phase 10c)
- [x] Form saham & crypto tidak punya field harga terkini (Phase 9)
- [x] History chart bisa toggle Total vs Per Account (Phase 10d)

---

## Phase 11 — Gold Tracking

> Pencatatan kepemilikan emas fisik/digital. Mirip saham & crypto: ada lokasi penyimpanan, pembelian (weight + harga/gram), jual sebagian/full, P&L unrealized. Harga terkini disuplai via `asset_prices` (ticker: `XAU`, assetType: `gold`, currency: `IDR`).

### 11a — Schema & Types

- [ ] Tambah tabel di `src/db/schema.ts`:
  - `gold_locations` — id, userId (fk), name, createdAt
  - `gold_holdings` — id, userId (fk), locationId (fk), weight numeric(20,4) (gram), purchasePrice numeric(20,4) (IDR/gram), purchaseDate, createdAt
  - `gold_sales` — id, userId (fk), goldId, weight, salePrice (IDR/gram), averageCostPrice, realizedPnl, realizedPnlPercent, saleDate, createdAt
- [ ] Tambah ke `src/lib/types.ts`:
  - `GoldLocation { id, name, createdAt }`
  - `GoldHolding { id, locationId, weight, purchasePrice, purchaseDate, createdAt }`
  - `GoldSale { id, goldId, weight, salePrice, averageCostPrice, realizedPnL, realizedPnLPercent, saleDate, createdAt }`
  - Tambah `goldLocations`, `golds`, `goldSales` ke `AppState`
- [ ] `pnpm db:push`

### 11b — Store

- [ ] Tambah ke Zustand store:
  - State: `goldLocations: GoldLocation[]`, `golds: GoldHolding[]`, `goldSales: GoldSale[]`
  - Actions: `addGoldLocation`, `updateGoldLocation`, `deleteGoldLocation`
  - Actions: `addGold`, `updateGold`, `deleteGold`, `sellGold`
  - Queries: `getGoldValue(goldId)`, `getGoldProfitLoss(goldId)`, `getTotalGoldValue()`
  - Harga dari `assetPrices.find(p => p.ticker === 'XAU')?.price ?? 0`

### 11c — API Routes

- [ ] `GET/POST /api/gold-locations`
- [ ] `PATCH/DELETE /api/gold-locations/[id]`
- [ ] `GET/POST /api/gold`
- [ ] `PATCH/DELETE /api/gold/[id]`
- [ ] `POST /api/gold/[id]/sell` — update weight + insert sale record (DB transaction)

### 11d — UI Components & Page

- [ ] `GoldForm.tsx` — fields: lokasi, berat (gram), harga beli (IDR/gram), tanggal beli
  - Gunakan `LocationPickerSelect` (reuse dari stocks/crypto)
- [ ] `GoldList.tsx` — group by lokasi, tampilkan weight + value + P&L
  - "Harga Terkini" dari `asset_prices` (XAU), tampilkan '—' bila belum ada
- [ ] `GoldSummary.tsx` — total weight, total value, total P&L
- [ ] `GoldSellDialog.tsx` — weight to sell, sale price/gram, preview realized P&L
- [ ] `src/app/(dashboard)/gold/page.tsx` — full page: summary + form + list
- [ ] Update `DashboardLayout.tsx`: tambah "Gold" ke Portfolio dropdown & mobile nav

---

## Notes

- `pnpm db:push` butuh `DATABASE_URL` valid di `.env.local`
- Default locations di-seed per-user saat pertama kali fetch (Phase 7)
- `stockSales` & `cryptoSales` tidak punya FK ke holdings by design
- PWA dipertahankan: `next-pwa` v5.6.0, build pakai `--webpack` flag
- Google OAuth tidak masuk scope, bisa ditambahkan belakangan
- `asset_prices` tabel global (bukan per-user): akan di-feed oleh BE scheduler nanti
- CoinGecko free tier: ~10-30 req/min, cukup untuk auto-complete on blur (tidak setiap keystroke)
- IDX stock names: tidak ada free API yang reliable, simpan di `asset_prices` secara manual atau via BE scheduler nanti
