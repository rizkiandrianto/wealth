# Plan + Tracker: Auth & DB Setup — Wealth App

## Context

Wealth app saat ini murni client-side — semua data tersimpan di `localStorage` via Zustand, belum ada DB, API routes, atau auth sama sekali. Referensi arsitektur diambil dari project excalidraw yang menggunakan Next.js App Router + Drizzle ORM + NextAuth v5.

Tujuan plan ini:
1. Restrukturisasi ke `src/`-based layout
2. Setup PostgreSQL + Drizzle ORM
3. Implementasi auth (login & register) mengikuti pola excalidraw

---

## Phase 1 — Src-Based Restructuring

- [x] Buat folder `src/` di root repo
- [x] Pindahkan `app/` → `src/app/`
- [x] Pindahkan `components/` → `src/components/`
- [x] Pindahkan `lib/` → `src/lib/`
- [x] Pindahkan `hooks/` → `src/hooks/`
- [x] Update `tsconfig.json`: `@/*` → `./src/*`
- [x] Rename `next.config.mjs` → `next.config.ts` dan cleanup
- [x] Buat route group `src/app/(auth)/` untuk login & register
- [x] Pindahkan semua pages ke `src/app/(dashboard)/`
- [ ] Pastikan `npm run dev` jalan tanpa error setelah restructure

## Phase 2 — Database Setup

- [ ] Install dependencies: `drizzle-orm pg @types/pg` dan dev: `drizzle-kit dotenv`
- [ ] Buat `drizzle.config.ts` di root
- [ ] Buat `src/db/index.ts` (Pool + drizzle instance)
- [ ] Buat `src/db/schema.ts` dengan tabel:
  - **Auth tables** (required NextAuth DrizzleAdapter):
    - [ ] `users` — id (uuid), name, email, password (nullable), emailVerified, image, createdAt
    - [ ] `accounts` — OAuth linking (provider, providerAccountId, userId fk)
    - [ ] `sessions` — sessionToken (pk), userId (fk), expires
    - [ ] `verificationTokens` — identifier, token, expires
  - **App tables** (pengganti localStorage):
    - [ ] `wealth_accounts` — id, userId (fk), name, type, balance, currency, createdAt
    - [ ] `transactions` — id, userId (fk), type, amount, fromAccountId, toAccountId, date, note
    - [ ] `stock_locations` — id, userId (fk), name
    - [ ] `stock_holdings` — id, userId (fk), locationId (fk), ticker, qty, avgPrice, createdAt
    - [ ] `stock_sales` — id, userId (fk), holdingId (fk), qty, salePrice, date, realizedPnl
    - [ ] `crypto_locations` — id, userId (fk), name
    - [ ] `crypto_holdings` — id, userId (fk), locationId (fk), symbol, qty, avgPrice, createdAt
    - [ ] `crypto_sales` — id, userId (fk), holdingId (fk), qty, salePrice, date, realizedPnl
    - [ ] `daily_balances` — id, userId (fk), date, totalBalance
- [ ] Tambah scripts ke `package.json`: `db:generate`, `db:migrate`, `db:push`
- [ ] Buat `.env.local` dengan `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- [ ] Jalankan `npm run db:push` untuk sync schema ke DB

## Phase 3 — Auth Implementation

- [ ] Install dependencies: `next-auth@beta @auth/drizzle-adapter bcryptjs` dan dev: `@types/bcryptjs`
- [ ] Buat `src/lib/auth.ts` (NextAuth v5 config):
  - DrizzleAdapter dengan 4 tabel auth
  - Session strategy: JWT
  - Credentials provider (email + password + bcrypt)
  - Callbacks: `jwt` (simpan `id`), `session` (expose `id`)
  - Custom page: `signIn: "/login"`
- [ ] Buat `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Buat `src/app/api/register/route.ts` (POST, validasi email unik, hash bcrypt, insert user)
- [ ] Buat `src/middleware.ts`:
  - Redirect unauthenticated ke `/login`
  - Redirect authenticated away dari `/login` & `/register`

## Phase 4 — Auth Pages

- [ ] Buat `src/app/(auth)/layout.tsx` (two-column: left branding, right form)
- [ ] Buat `src/app/(auth)/login/page.tsx` (form email+password, `signIn`, error handling, link ke register)
- [ ] Buat `src/app/(auth)/register/page.tsx` (form name+email+password, POST `/api/register`, auto-login, link ke login)
- [ ] Update `src/app/providers.tsx` — tambah `SessionProvider`
- [ ] Update `src/app/layout.tsx` — wrap dengan `Providers`
- [ ] Buat `src/app/(dashboard)/layout.tsx` — check session, redirect ke `/login` jika tidak ada

---

## Verification Checklist

- [ ] `npm run dev` — no TS errors
- [ ] Buka `/` → redirect ke `/login`
- [ ] Register user baru → redirect ke `/`
- [ ] Login dengan user yang sama → masuk ke dashboard
- [ ] Akses `/login` saat sudah login → redirect ke `/`
- [ ] `npm run db:generate` → menghasilkan migration file di `drizzle/`

---

## Notes

- Data localStorage belum dimigrasi ke DB dalam scope plan ini — itu step selanjutnya setelah auth berjalan
- Google OAuth tidak masuk scope awal, bisa ditambahkan belakangan
- Referensi: project excalidraw (`../excalidraw`)
