# CLAUDE.md — Wealth App Conventions

Project-local notes for Claude Code. Keep this short; details live in `plan/`.

## Stack

Next.js 16 App Router · Drizzle ORM (Postgres) · NextAuth v5 · TanStack Query (Stage 1+) · Zustand (UI state only post-Stage 2) · shadcn/ui · Tailwind.

## Plan Directory

All active plans live in `plan/*.md`. Read the relevant plan **before** starting work on a feature:

- `plan/portfolio-snapshot.md` — Daily portfolio value snapshot (independent)
- `plan/component-loading.md` — Stage 1: TanStack Query migration, per-component loading
- `plan/per-page-api.md` — Stage 2: per-page API splitting, store cleanup

Each plan has a **Tracker** section with checkboxes. Update checkboxes as work progresses.

Master history tracker: `PLAN.md` (root) — completed phases sebelumnya.

## Per-Page API Map — Source of Truth

**Tabel resmi**: `plan/per-page-api.md` → section "Required APIs per Page".

### Rule (enforce per PR)

Setiap kali:
- Bikin **page baru** yang fetch data, **atau**
- Bikin **komponen baru** yang fetch data sendiri (TanStack Query hook baru), **atau**
- Existing page nambah/kurang endpoint dependency

→ **Wajib update tabel "Required APIs per Page" di `plan/per-page-api.md`** di PR yang sama.

Plus: di top file page (`src/app/(dashboard)/<page>/page.tsx`) tambah komentar:
```tsx
// Required APIs:
//   GET /api/...
//   GET /api/...
```

Tujuan: hindari regression ke pola monolithic `fetchAll()`. Tracking eksplisit endpoint mana yang ke-hit per page.

## Data Fetching Convention (post-Stage 1)

- **Server state** (anything from `/api/*`) → TanStack Query (`src/lib/queries/`). Tidak boleh di Zustand store.
- **UI state** (form draft, dialog open, filter selection) → Zustand atau local `useState`. Tidak boleh di TanStack Query.
- **Derived/computed values** → pure functions di `src/lib/calculations/`, terima data sebagai argument (bukan ambil dari store).
- **Mutation** → TanStack `useMutation` + invalidate query keys yang terdampak. Lihat invalidation matrix di `plan/component-loading.md`.

## Workflow Convention

- Setiap plan = branch sendiri (`feat/<plan-name>`). Cut dari `develop`.
- Setiap sub-step di tracker = 1 commit. AI **stop & tawarkan commit + test** setelah tiap sub-step — jangan auto-lanjut tanpa konfirmasi user.
- Test pass → lanjut. Test fail → fix dulu, baru commit.
