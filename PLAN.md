# Plan + Tracker: Auth & DB Setup — Wealth App

## Context

Wealth app saat ini murni client-side — semua data tersimpan di `localStorage` via Zustand, belum ada DB, API routes, atau auth sama sekali. Referensi arsitektur diambil dari project excalidraw yang menggunakan Next.js App Router + Drizzle ORM + NextAuth v5.

Tujuan plan ini:
1. Restrukturisasi ke `src/`-based layout
2. Setup PostgreSQL + Drizzle ORM
3. Implementasi auth (login & register) mengikuti pola excalidraw

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
- [ ] Jalankan `npm run db:push` untuk sync schema ke DB ← **butuh DATABASE_URL valid**

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

## Verification Checklist

- [x] `pnpm build` — berhasil tanpa error
- [x] TypeScript check (`npx tsc --noEmit`) — clean
- [ ] Buka `/` → redirect ke `/login`
- [ ] Register user baru → redirect ke `/`
- [ ] Login dengan user yang sama → masuk ke dashboard
- [ ] Akses `/login` saat sudah login → redirect ke `/`
- [ ] `pnpm db:generate` → menghasilkan migration file di `drizzle/`

> Untuk verifikasi runtime, isi `DATABASE_URL` di `.env.local` lalu jalankan `pnpm db:push` dan `pnpm dev`.

---

## Notes

- Data localStorage belum dimigrasi ke DB — itu step selanjutnya setelah auth berjalan
- Google OAuth tidak masuk scope awal, bisa ditambahkan belakangan
- PWA dipertahankan: `next-pwa` v5.6.0, build menggunakan `--webpack` flag (Turbopack tidak kompatibel dengan next-pwa v5)
- Referensi: project excalidraw (`../excalidraw`)
