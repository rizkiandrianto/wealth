# Stage 1 — Component-level Data Loading

## Context

Saat ini `StoreInitializer` (mounted di `src/app/(dashboard)/layout.tsx`) memanggil `fetchAll()` di `useAssetStore` yang hit **13 endpoint paralel** sebelum page mana pun bisa render. Konsekuensi:
- Setiap halaman blocking sampai `hasHydrated: true` (full-page `<PageLoader />`)
- Tidak ada progressive rendering — user lihat satu spinner besar, lalu semuanya muncul sekaligus
- Komponen kecil tergantung pada bootstrap global, bukan punya loading state sendiri
- Page `/accounts` (hanya butuh 1 endpoint) menunggu API stocks, crypto, gold, sales, prices selesai semua

Tujuan Stage 1: tiap komponen punya **loading state sendiri** & fetch hanya data yang diperlukan. UX: skeleton per-komponen, bukan satu spinner blocking di tengah halaman.

## Working Agreement

- **Branch**: `feat/component-loading` (cut dari `develop`).
- **Per sub-step di tracker = 1 commit**. Setelah tiap sub-step (atau group yang berkaitan), AI **stop dan tawarkan commit + test**. Jangan lanjut tanpa konfirmasi user.
- Test pass → lanjut. Test fail → fix dulu, baru commit.
- Stage 1 selesai dulu sebelum Stage 2 (`plan/per-page-api.md`) dimulai.

## Approach

Adopt **TanStack Query v5** (sudah dikonfirmasi user) sebagai data-fetching layer:
- Built-in caching, deduplication, refetch on focus/reconnect
- Per-query `isLoading`/`error` state — natural untuk per-component skeleton
- `useMutation` untuk POST/PATCH/DELETE dengan auto-invalidate
- `staleTime` global → fetch antar-page navigation di-share otomatis

**Asset price reuse — key behavior**: `useAssetPricesQuery()` pakai `queryKey: ['assetPrices']` di mana pun dipanggil. TanStack Query auto-share cache di seluruh app — fetch sekali, reused di Dashboard, Stocks, Crypto, Gold, dan semua Sell dialog tanpa duplicate request. Same untuk semua query lain dengan query key sama.

Zustand store **tetap dipertahankan** selama Stage 1 untuk:
- UI state (form drafts, filters, dialog open state)
- Backward-compat: komponen yang belum dimigrate masih jalan via store

Cleanup full di Stage 2.

## Files to Create / Modify

### Phase 1.1 — Foundation

#### 1.1.1 Extract `apiFetch` ke common util
Saat ini `apiFetch` ada inline di `src/lib/store/useAssetStore.ts:111-119`. Extract jadi **common util** supaya store (legacy) & query hooks (baru) pakai implementasi sama.

- Create `src/lib/apiFetch.ts`:
  ```ts
  export async function apiFetch(path: string, init?: RequestInit) {
    const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
    if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`)
    if (res.status === 204) return null
    return res.json()
  }
  ```
- Update `src/lib/store/useAssetStore.ts` → import dari `@/lib/apiFetch`, hapus inline-nya.
- No behavior change. Pure refactor.

#### 1.1.2 Install TanStack Query
```
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

#### 1.1.3 QueryProvider + wrap root
- `src/components/providers/QueryProvider.tsx` (`'use client'`):
  - `QueryClient` dengan defaults: `staleTime: 60_000`, `gcTime: 5*60_000`, `refetchOnWindowFocus: false` (override per-query untuk prices).
  - `<ReactQueryDevtools>` mounted di dev only.
- `src/app/layout.tsx` → wrap children dengan `<QueryProvider>` (di bawah SessionProvider/Providers existing).

### Phase 1.2 — Per-domain query hooks

#### 1.2.1 Central query key registry
`src/lib/queries/keys.ts`:
```ts
export const queryKeys = {
  accounts: ['accounts'] as const,
  transactions: ['transactions'] as const,
  accountSnapshots: ['accountSnapshots'] as const,
  stocks: ['stocks'] as const,
  stockLocations: ['stockLocations'] as const,
  stockSales: ['stockSales'] as const,
  cryptos: ['cryptos'] as const,
  cryptoLocations: ['cryptoLocations'] as const,
  cryptoSales: ['cryptoSales'] as const,
  golds: ['golds'] as const,
  goldLocations: ['goldLocations'] as const,
  goldSales: ['goldSales'] as const,
  assetPrices: ['assetPrices'] as const,
  portfolioSnapshots: ['portfolioSnapshots'] as const,
} as const
```

#### 1.2.2 Query + mutation hooks per domain
`src/lib/queries/{accounts,transactions,stocks,stockLocations,crypto,cryptoLocations,gold,goldLocations,prices,accountSnapshots}.ts`.

Setiap file expose:
- **Query factory** (untuk prefetch di Stage 2): `accountsQueryOptions() => ({ queryKey, queryFn })`
- **Query hook**: `useAccountsQuery()` → `useQuery(accountsQueryOptions())`
- **Mutation hooks**: `useAddAccount()`, `useUpdateAccount()`, `useDeleteAccount()` — masing-masing dengan invalidation matrix di bawah.

Reuse `apiFetch` dari `src/lib/apiFetch.ts` (sama dengan store).

**Special: `prices.ts`** override default:
```ts
useQuery({ ...assetPricesQueryOptions(), staleTime: 30_000, refetchOnWindowFocus: true })
```

#### 1.2.3 Mutation Invalidation Matrix

| Mutation | Invalidate queryKeys |
|---|---|
| `useAddTransaction` / `useDeleteTransaction` | `transactions`, `accounts`, `accountSnapshots` |
| `useAddAccount` / `useUpdateAccount` | `accounts` |
| `useDeleteAccount` | `accounts`, `transactions`, `accountSnapshots` |
| `useAddStock` | `stocks` |
| `useUpdateStock` / `useDeleteStock` | `stocks` |
| `useSellStock` / `useSellStockBatch` | `stocks`, `stockSales`, `accounts` |
| `useAdd/Update/DeleteStockLocation` | `stockLocations` (+ `stocks` kalau cascade) |
| `useAddCrypto` / `useSellCrypto` / etc. | mirror stocks → `cryptos`, `cryptoSales`, `accounts` |
| `useAddGold` / `useSellGold` / etc. | mirror stocks → `golds`, `goldSales`, `accounts` |
| `useAdd/Update/DeleteCryptoLocation` | `cryptoLocations` |
| `useAdd/Update/DeleteGoldLocation` | `goldLocations` |

### Phase 1.3 — Migrate components (incremental, satu domain per sub-step)

Pattern per komponen:
```tsx
const { data: stocks = [], isLoading } = useStocksQuery()
const { data: prices = [] } = useAssetPricesQuery()
if (isLoading) return <StocksListSkeleton />
return <ul>{stocks.map(s => <li>{getValue(s, prices)}</li>)}</ul>
```

Urutan (paling kecil → paling kompleks). Setiap sub-step = 1 commit, stop & test.

- **1.3.1 Accounts**: `AccountsList.tsx`, `AccountCard.tsx`, `(dashboard)/accounts/page.tsx`, `(dashboard)/accounts/[id]/page.tsx`
- **1.3.2 Transactions**: `RecentTransactions.tsx`, `TransactionForm.tsx`, `(dashboard)/transactions/page.tsx`
- **1.3.3 Stocks**: `StocksList.tsx`, `StocksByLocation.tsx`, `StocksSummary.tsx`, `StockForm.tsx`, `StockSellDialog.tsx`, `StockSellLocationDialog.tsx`, `(dashboard)/stocks/page.tsx`
- **1.3.4 Crypto**: mirror stocks
- **1.3.5 Gold**: mirror stocks (single dialog)
- **1.3.6 Dashboard**: pecah `DashboardSummary.tsx` jadi sub-component per asset class (`CashSummaryCard`, `StocksSummaryCard`, `CryptoSummaryCard`, `GoldSummaryCard`) — masing-masing punya skeleton sendiri & loading independen. Migrate `(dashboard)/page.tsx`.
- **1.3.7 History**: `BalanceChart.tsx`, `HistoryTable.tsx`, `(dashboard)/history/page.tsx`.

### Phase 1.4 — Skeleton inline per komponen

Gunakan `Skeleton` dari `src/components/ui/skeleton.tsx` (shadcn, sudah ada). Inline di file komponen, tidak perlu file baru per skeleton.

## Caveats

- **Backward compat**: `StoreInitializer` masih ada selama Stage 1. App tetap working selama migrasi bertahap.
- **Mutation invalidation comprehensive**: ikuti matrix. Cross-domain invalidation gampang lupa (mis. transaction → invalidate accounts juga).
- **Optimistic updates**: skip dulu. Default = refetch after mutation.
- **401 handling**: `apiFetch` deteksi 401 → redirect ke `/login`. Atau pakai global error boundary di QueryProvider.

## Verification

1. Network tab: setelah Accounts dimigrate, buka `/accounts` → component render skeleton dulu, list muncul progressive. Bandingkan dengan page yang belum migrate (masih `<PageLoader />` global).
2. Stocks page (post-migrate): summary card render skeleton, list render skeleton, masing-masing muncul independen.
3. Mutation: tambah transaction di `/transactions` → list & account balance update otomatis tanpa reload.
4. **Asset price share**: buka Dashboard → Stocks → Crypto → Gold rapid. Network tab: `/api/market/prices` cuma hit sekali (cache shared, staleTime belum lewat).
5. React Query DevTools (dev): inspect cache state, verify query keys & status.
6. `pnpm build` clean.

---

## Tracker

### Phase 1.1 — Foundation
- [x] **1.1.1** Extract `apiFetch` ke `src/lib/apiFetch.ts`, refactor useAssetStore import
- [x] **1.1.2** Install `@tanstack/react-query` + devtools
- [x] **1.1.3** Create `QueryProvider`, wrap root layout
- [x] **1.1.4** Smoke test: app jalan, devtools panel visible, no regression (deferred ke 1.4.2 final build)

### Phase 1.2 — Query hooks
- [x] **1.2.1** Create `src/lib/queries/keys.ts`
- [x] **1.2.2** Create query + mutation hooks: accounts
- [x] **1.2.3** Create query + mutation hooks: transactions
- [x] **1.2.4** Create query + mutation hooks: stocks + stockLocations + stockSales
- [x] **1.2.5** Create query + mutation hooks: crypto + cryptoLocations + cryptoSales
- [x] **1.2.6** Create query + mutation hooks: gold + goldLocations + goldSales
- [x] **1.2.7** Create query hooks: prices (refetchOnWindowFocus override), accountSnapshots, portfolioSnapshots (kalau sudah ada)

### Phase 1.3 — Component migration
- [x] **1.3.1** Migrate Accounts (list, card, pages)
- [x] **1.3.2** Migrate Transactions (list, form, page)
- [x] **1.3.3** Migrate Stocks (list, by-location, summary, form, dialogs, page)
- [x] **1.3.4** Migrate Crypto (mirror stocks)
- [x] **1.3.5** Migrate Gold (mirror stocks)
- [x] **1.3.6** Split DashboardSummary per asset class + migrate
- [x] **1.3.7** Migrate History (chart, table, page)

### Phase 1.4 — Polish
- [x] **1.4.1** Inline skeleton di semua list & summary components
- [x] **1.4.2** Final smoke test + `pnpm build` clean

### Phase 1.5 — Wrap up
- [x] **1.5.1** Open PR ke `develop`
- [x] **1.5.2** Test pass → merge → proceed ke Stage 2

Setiap item di tracker = 1 commit + stop & test sebelum lanjut.
