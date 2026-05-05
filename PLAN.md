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

## Phase 8 — Menu Redesign + Sign Out

- [ ] Refactor `DashboardLayout.tsx`:
  - Grouped top nav: Dashboard | Finance ▼ | Portfolio ▼ | History | [Nama User ▼]
  - Finance dropdown: Accounts, Transactions
  - Portfolio dropdown: Stocks, Crypto
  - User dropdown: nama user dari session + Sign Out
  - Mobile bottom nav: 4 item (Dashboard, Finance, Portfolio, History)
  - Mobile hamburger: tambah Sign Out di bawah list nav
  - `signOut()` dari `next-auth/react`
- [ ] `pnpm build` clean

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

## Notes

- `pnpm db:push` butuh `DATABASE_URL` valid di `.env.local`
- Default locations di-seed per-user saat pertama kali fetch (Phase 7)
- `stockSales` & `cryptoSales` tidak punya FK ke holdings by design (sale record tetap ada walau holding dihapus)
- PWA dipertahankan: `next-pwa` v5.6.0, build pakai `--webpack` flag (Turbopack tidak kompatibel)
- Google OAuth tidak masuk scope, bisa ditambahkan belakangan
