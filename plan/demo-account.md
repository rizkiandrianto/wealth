# Demo Account System

## Context

The wealth app is going public — anyone visiting should be able to try it end-to-end
without signing up. To make this safe and predictable we introduce a **demo account**:
a pre-seeded user that can read every screen but is **blocked from any mutation** both
server-side (defense) and UI-side (graceful UX with a warning dialog).

Decisions (confirmed):
- **Credentials**: `demo@mailinator.com` / `demo1234` (documented in README).
- **DB flag**: `users.is_demo BOOLEAN DEFAULT FALSE` (nullable per requirement).
- **Server guard**: single `src/middleware.ts` returns **401** on POST/PUT/PATCH/DELETE
  to `/api/*` when `session.user.isDemo === true`. Covers all 28 mutation routes
  without touching them.
- **UI guard**: a `useGuardedMutation` wrapper around `useMutation`. Buttons stay
  enabled. On submit, if user is demo, a global `DemoNoticeDialog` opens and the
  network request is never fired.
- **Seed**: minimal hand-rolled sample data inside the seed script (1 bank account,
  1 cash account, 1–2 stocks, 1 crypto, 1 transaction) — not the larger `seed/*.sql`
  files. Keeps the seed self-contained and predictable.

## Working Agreement

- **Branch**: `feat/demo-account` (cut from `develop`).
- **Per sub-step in Tracker = 1 commit**. Stop & offer commit + test after each.

---

## Files to create / modify

### 1. Schema + migration

**Modify** `src/db/schema.ts:16-24` — add `isDemo` to `users`:
```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  isDemo: boolean("is_demo").default(false),                // ← new
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
```

**Create** `drizzle/0003_add_is_demo_to_users.sql`:
```sql
ALTER TABLE "users" ADD COLUMN "is_demo" boolean DEFAULT false;
```
(Run `pnpm drizzle-kit generate` then commit; or hand-author following the project's
existing migration style.)

### 2. NextAuth — propagate `isDemo` into the session

**Modify** `src/lib/auth.ts`:
- In the **Credentials `authorize`** callback (line 47), include `isDemo` in the
  returned user object so it flows into the JWT on first sign-in.
- In the **`jwt` callback** (line 71): when `user` is present, also set
  `token.isDemo = user.isDemo`. When `user` is absent (subsequent requests), the
  token already carries `isDemo` — no DB hit needed.
- In the **`session` callback** (line 75): set `session.user.isDemo = token.isDemo`.

**Create** `src/types/next-auth.d.ts` to teach TypeScript about the new field:
```ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session { user: { id: string; isDemo?: boolean } & DefaultSession["user"] }
  interface User extends DefaultUser { isDemo?: boolean }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT { id?: string; isDemo?: boolean }
}
```

### 3. Server-side guard — `src/middleware.ts` (new)

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default auth((req) => {
  if (!MUTATING.has(req.method)) return;
  if (req.auth?.user?.isDemo) {
    return NextResponse.json(
      { error: "Demo account is read-only" },
      { status: 401 },
    );
  }
});

export const config = {
  // /api/auth/* (NextAuth) and /api/register must stay reachable.
  matcher: ["/api/((?!auth|register).*)"],
};
```

### 4. Client-side guard

**Create** `src/components/providers/DemoGuardProvider.tsx`:
- React context exposing `{ openDemoDialog: () => void }`.
- Owns an `<AlertDialog>` based on existing `ConfirmDialog` styling:
  - Title: "Demo account"
  - Description: "This is a demo account. Adding, editing, and deleting data is
    disabled. Sign up with your own email to save real data."
  - Single "Got it" button (no Cancel — it's an acknowledgement, not a confirm).
- Mount inside `src/components/providers/QueryProvider.tsx` (or wherever the root
  providers compose, so it wraps every page).

**Create** `src/lib/queries/useGuardedMutation.ts`:
```ts
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useDemoGuard } from "@/components/providers/DemoGuardProvider";

export class DemoBlockedError extends Error { constructor() { super("Demo blocked"); } }

export function useGuardedMutation<TData, TErr, TVars, TCtx = unknown>(
  options: UseMutationOptions<TData, TErr, TVars, TCtx>,
) {
  const { data: session } = useSession();
  const { openDemoDialog } = useDemoGuard();
  const isDemo = !!session?.user?.isDemo;
  return useMutation<TData, TErr, TVars, TCtx>({
    ...options,
    mutationFn: async (vars) => {
      if (isDemo) { openDemoDialog(); throw new DemoBlockedError(); }
      return options.mutationFn!(vars);
    },
    onError: (err, vars, ctx) => {
      if (err instanceof DemoBlockedError) return;          // swallow silently
      options.onError?.(err, vars, ctx);
    },
  });
}
```

**Modify** mutation hook files — swap `useMutation` → `useGuardedMutation` in:
- `src/lib/queries/accounts.ts` — `useAddAccount`, `useUpdateAccount`, `useDeleteAccount`
- `src/lib/queries/transactions.ts`
- `src/lib/queries/stocks.ts`, `stockSales.ts`, `stockLocations.ts`
- `src/lib/queries/crypto.ts`, `cryptoSales.ts`, `cryptoLocations.ts`
- `src/lib/queries/gold.ts`, `goldSales.ts`, `goldLocations.ts`
- `src/lib/queries/marketPrices.ts` (if it exports a manual override mutation)

The signature is identical, so this is a one-line swap per file.

### 5. Demo user + minimal data seed

**Create** `scripts/seed-demo.ts`:
- Hashes `demo1234` with `bcryptjs` (rounds: 12, matching `/api/register`).
- Upserts user `demo@mailinator.com` with `isDemo: true` (idempotent on conflict).
- Inserts minimal sample data **only if the demo user is newly created** (so
  re-running the script doesn't duplicate rows):
  - 1 bank account (BCA, IDR), 1 cash account (IDR).
  - 1 stock location ("Ajaib"), 1 holding (`BBCA`, IDR, ~10 shares).
  - 1 crypto location ("Nanovest"), 1 holding (`BTC`).
  - 1 transaction (deposit into BCA).
- Uses the existing `db` instance from `src/db/index.ts`.

**Add npm script** in `package.json`:
```json
"seed:demo": "tsx scripts/seed-demo.ts"
```

(Project already uses `tsx` for similar scripts — verify in `package.json`. If not,
swap to whatever script runner the repo uses.)

### 6. Login UX — surface demo credentials

**Modify** the login page (likely `src/app/login/page.tsx`) — add a small
"Try the demo" hint under the form:
> Want to look around first? Log in as **demo@mailinator.com** / **demo1234** (read-only).

Optional but high-leverage for a public-facing app.

### 7. README

**Modify** `README.md` — add a **Demo Account** section after the Environment
Variables block:

```markdown
## Demo Account

The app is open for anyone to try without signing up. Use:

| Field    | Value              |
| -------- | ------------------ |
| Email    | demo@mailinator.com    |
| Password | demo1234           |

The demo account is **read-only**. You can browse every page and see sample data,
but any attempt to add, edit, or delete will:

1. **Server**: return `401 Unauthorized` from `POST/PUT/PATCH/DELETE` on `/api/*`
   (enforced by `src/middleware.ts` checking `session.user.isDemo`).
2. **UI**: open a "Demo account" notice dialog explaining the limitation, *before*
   the network request is fired (via `useGuardedMutation`).

### How a user is marked as demo
The `users` table has an `is_demo BOOLEAN DEFAULT FALSE` column. Only rows where
`is_demo = true` are subject to the read-only guard.

### Seeding / resetting the demo account
\```bash
pnpm seed:demo
\```
Creates the demo user (idempotent) and inserts a minimal portfolio (bank + cash
accounts, one stock, one crypto, one transaction) so the dashboard is non-empty.
```

---

## Reused existing utilities

- `src/components/ConfirmDialog.tsx` — style/markup template for the
  `DemoNoticeDialog` (use `<AlertDialog>` primitives, same as the rest of the app).
- `src/lib/auth.ts` `auth()` export — directly usable as the v5 middleware factory
  (`export default auth((req) => …)`).
- `src/lib/apiFetch.ts` — no changes needed; it already throws on non-ok, which
  callers handle via TanStack `error`. The middleware-returned 401 will flow through
  naturally for any non-mutation hook path we missed (belt + suspenders).
- `src/lib/queries/*.ts` — all mutation hooks already share the
  `useMutation({ mutationFn, onSuccess })` shape, so the wrapper swap is one line
  per file.
- Existing `bcryptjs` import pattern (`src/app/api/register/route.ts`) — reuse for
  the seed script.

---

## Verification

After each commit:
- **Build**: `pnpm build` clean (TypeScript catches the `isDemo` type extension
  and missing wrapper imports).
- **Migration**: `pnpm drizzle-kit migrate` (or `pnpm db:push`) succeeds; verify
  in psql that `users.is_demo` exists and defaults to `false`.

End-to-end manual test (after seed step):
1. `pnpm seed:demo` → demo user created with sample data.
2. Sign in as `demo@mailinator.com` / `demo1234` → dashboard renders with seeded
   accounts, stock, crypto, transaction.
3. Click "Add account" → fill form → submit. **Expected**: `DemoNoticeDialog`
   opens immediately; no `POST /api/accounts` in DevTools Network tab.
4. Click "Delete" on an account → confirm. **Expected**: same dialog; no
   `DELETE /api/accounts/:id` request.
5. Edit a stock holding → save. **Expected**: same dialog.
6. **Server defence test** (bypass UI): with the demo session cookie set, hit
   `curl -X POST http://localhost:3000/api/accounts -H 'cookie: …' -d '{…}'`.
   **Expected**: `401 {"error":"Demo account is read-only"}`.
7. Sign out, sign in as a **regular** user → all mutations work normally
   (regression check — wrapper passes through when `isDemo` is false/undefined).
8. **Login hint** (if step 6 done): demo credentials visible on `/login`.

Edge cases to spot-check:
- A demo user calling `GET /api/*` → must still work (only mutating methods are
  blocked).
- `POST /api/auth/*` (NextAuth callbacks) and `POST /api/register` → reachable
  (excluded by the middleware matcher).
- Existing non-demo users keep working — `isDemo` is nullable + defaults to false,
  and the JWT for already-issued sessions will read `token.isDemo` as `undefined`
  (falsy) until next sign-in.

---

## Tracker

### Phase 1 — Schema & session plumbing
- [x] **DA.1** Add `isDemo` to `users` in `src/db/schema.ts`; migration `drizzle/0003_add_is_demo_to_users.sql` (+ journal entry)
- [x] **DA.2** Extend NextAuth callbacks (`authorize`, `jwt`, `session`) to propagate `isDemo`; add `src/types/next-auth.d.ts`

### Phase 2 — Server guard
- [x] **DA.3** Demo guard integrated into existing `src/proxy.ts` (Next.js 16 renames `middleware.ts` → `proxy.ts`); blocks POST/PUT/PATCH/DELETE on `/api/*` for demo users (excludes `/api/auth/*` and `/api/register`)

### Phase 3 — Client guard
- [x] **DA.4** `src/components/providers/DemoGuardProvider.tsx` + mounted in `src/app/[locale]/providers.tsx`
- [x] **DA.5** `src/lib/queries/useGuardedMutation.ts` (+ `DemoBlockedError`) — signatures updated for TanStack Query v5.100 `MutationFunctionContext`
- [x] **DA.6** Swapped `useMutation` → `useGuardedMutation` across all 8 mutation hook files

### Phase 4 — Seed & docs
- [x] **DA.7** `seed/demo/seed.ts` + `seed/demo/README.md` + `pnpm seed:demo` (relocated from `scripts/` per user direction)
- [x] **DA.8** Login page hint via new `demo.loginHint` i18n key (EN + ID)
- [x] **DA.9** README root "Demo Account" section

### Phase 5 — Verify
- [ ] **DA.10** Run `pnpm seed:demo`, then full manual checklist (steps 2–7 above)
- [x] **DA.11** `pnpm build` clean
- [ ] **DA.12** Open PR to `develop`

Each item = 1 commit + stop & test before next.
