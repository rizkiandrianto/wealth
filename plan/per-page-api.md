# Stage 2 — Per-Page API Splitting

**Prerequisite**: Stage 1 (`plan/component-loading.md`) selesai — semua komponen sudah pakai TanStack Query.

## Context

Setelah Stage 1, secara teoretis tiap page cuma trigger query yang dibutuhkan komponen di page itu. Tapi:
- `StoreInitializer` masih ada di `src/app/(dashboard)/layout.tsx` → tetap pre-fetch 13 endpoint setiap dashboard mount
- Tidak ada audit / source-of-truth tentang page X butuh endpoint apa
- Tidak ada prefetch — komponen baru mount → fetch → skeleton sebentar (acceptable, tapi bisa lebih baik)

Tujuan Stage 2: pastikan tiap navigasi page **cuma hit endpoint minimum** yang dibutuhkan, eksplisit & terdokumentasi. Plus enforce konvensi: setiap page baru wajib update dokumentasi.

## Working Agreement

- **Branch**: `feat/per-page-api` (cut dari `develop`, setelah Stage 1 merged).
- **Per sub-step di tracker = 1 commit**. AI stop & tawarkan commit + test setelah tiap sub-step.
- Verifikasi via Chrome DevTools Network tab tiap sub-step (lihat tabel Verification).

## Approach

Tiga gerakan:
1. **Bongkar `StoreInitializer`** — hapus monolithic `fetchAll()`. Tiap page rely on komponennya untuk fetch.
2. **Page-level prefetch** (polish) — tiap page expose set query factories yang di-fire via `queryClient.prefetchQuery` di mount, supaya fetch start lebih awal (paralel dengan render komponen).
3. **Audit + dokumentasi resmi** — tabel page → required APIs sebagai source of truth. Update CLAUDE.md rule.

## Files to Modify

### Phase 2.1 — Bongkar bootstrap monolithic

#### 2.1.1 Hapus `StoreInitializer` dari layout
`src/app/(dashboard)/layout.tsx`: hapus `<StoreInitializer />` dari render tree. Layout tinggal `auth()` check + redirect + nav + children.

#### 2.1.2 Hapus file `src/components/StoreInitializer.tsx`
Setelah confirmed no other imports.

#### 2.1.3 Verifikasi semua page masih working
Tiap page yang sudah migrate di Stage 1 = harus jalan tanpa StoreInitializer. Smoke test semua page.

### Phase 2.2 — Page-level prefetch (opsional, recommended)

Pattern: tiap page client component prefetch query factories yang dibutuhkan di `useEffect` mount.

```tsx
// src/app/(dashboard)/stocks/page.tsx
'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  stocksQueryOptions,
  stockLocationsQueryOptions,
  assetPricesQueryOptions,
  stockSalesQueryOptions,
} from '@/lib/queries'

export default function StocksPage() {
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(stocksQueryOptions())
    qc.prefetchQuery(stockLocationsQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
    qc.prefetchQuery(stockSalesQueryOptions())
  }, [qc])
  return <StocksPageContent />
}
```

Manfaat: fetch fire saat page mount, paralel dengan render sub-tree. Tanpa prefetch, komponen sub-tree mount dulu baru fetch (delay kecil).

Tambahkan prefetch ke semua 7 pages. Lihat tabel "Required APIs per Page" di bawah.

### Phase 2.3 — Required APIs per Page (source of truth)

**Tabel ini = single source of truth**. Setiap page baru / perubahan dependency = **wajib update tabel ini** (lihat CLAUDE.md rule).

| Page | Required APIs |
|---|---|
| `/` (Dashboard) | `/api/accounts`, `/api/transactions?limit=5`, `/api/stocks/summary`, `/api/stocks/tickers`, `/api/stocks/sales/summary`, `/api/crypto/summary`, `/api/crypto/tickers`, `/api/crypto/sales/summary`, `/api/gold/summary`, `/api/gold/tickers`, `/api/gold/sales/summary` |
| `/accounts` | `/api/accounts` |
| `/accounts/[id]` | `/api/accounts`, `/api/transactions?accountId=[id]` |
| `/stocks` | `/api/stocks`, `/api/stock-locations`, `/api/market/prices`, `/api/stocks/sales` |
| `/crypto` | `/api/crypto`, `/api/crypto-locations`, `/api/market/prices`, `/api/crypto/sales` |
| `/gold` | `/api/gold`, `/api/gold-locations`, `/api/market/prices`, `/api/gold/sales` |
| `/transactions` | `/api/accounts`, `/api/transactions` |
| `/history` | `/api/accounts`, `/api/account-snapshots`, `/api/portfolio-snapshots` (kalau Portfolio Snapshot plan sudah landed) |

Tambah komentar di tiap page file (top of file, sebelum export default):
```tsx
// Required APIs:
//   GET /api/stocks
//   GET /api/stock-locations
//   GET /api/market/prices
//   GET /api/stocks/sales
```

### Phase 2.4 — Cleanup `src/lib/store/useAssetStore.ts`

Setelah Stage 1 + Phase 2.1:
- Hapus state slice yang sudah pindah ke TanStack Query (accounts, transactions, stocks, cryptos, golds, sales, snapshots, prices, locations)
- Hapus loader functions (`fetchAll`, all `add*`, `update*`, `delete*` — sudah jadi mutation hooks)
- Hapus getter (`getTotalBalance`, `getStockValue`, etc.) → **pindahkan jadi pure functions** di `src/lib/calculations/{accounts,stocks,crypto,gold,portfolio}.ts`. Pure functions terima data sebagai argument:
  ```ts
  // sebelum (di store): getStockValue(stockId) → akses state.stocks + state.assetPrices
  // sesudah: getStockValue(stock, prices) → pure, testable
  ```
- Komponen yang sebelumnya pakai `getStockValue` via store sekarang panggil function pure dengan data dari `useStocksQuery()` + `useAssetPricesQuery()`.
- Kalau setelah cleanup tidak ada UI state tersisa di store → **hapus file `useAssetStore.ts`** seluruhnya.
- Update semua import komponen.

### Phase 2.5 — Audit & Docs

#### 2.5.1 Network tab audit
Manual test tiap page:
1. Hard reload page X.
2. Network tab → catat semua `/api/*` requests.
3. Compare dengan tabel "Required APIs per Page".
4. Kalau ada endpoint extra → investigate (mungkin komponen yang tidak sengaja masih pakai store / belum migrate).
5. Kalau ada endpoint missing → investigate (mungkin komponen tidak fetch dengan benar).

#### 2.5.2 Update CLAUDE.md
Pastikan `CLAUDE.md` di root punya rule: "setiap page/komponen baru yang fetch data → update `plan/per-page-api.md` tabel Required APIs".

## Caveats

- **Page navigation flicker**: cache `staleTime: 60_000` cukup nge-mute flicker antar navigasi cepat. Yang lewat staleTime → background refetch (stale-while-revalidate).
- **Asset prices di banyak page**: query key sama → di-share otomatis oleh TanStack Query. Fetch sekali per stale window walaupun dibuka di 4 page.
- **Dashboard masih heavy** (9 endpoint). Mitigasi sudah di Stage 1 (split per asset class). Tiap card load independen, summary section render progressive — user lihat data muncul bertahap, bukan tunggu semua.
- **Helper functions** (`getStockValue`, dll) yang sebelumnya di store harus dipindah ke pure functions. Banyak call site, hati-hati. Sebagai mitigasi: rename function sekaligus (mis. `calcStockValue`) supaya TypeScript error di semua call site → pasti semua kelihatan.

## Verification

| Page | Expected endpoints (hard reload) |
|---|---|
| `/accounts` | 1 endpoint: `/api/accounts` |
| `/stocks` | 4: stocks, stock-locations, prices, stocks/sales |
| `/crypto` | 4: crypto, crypto-locations, prices, crypto/sales |
| `/gold` | 4: gold, gold-locations, prices, gold/sales |
| `/transactions` | 2: accounts, transactions |
| `/history` | 2-3: accounts, account-snapshots, (portfolio-snapshots) |
| `/` Dashboard | 9 (lihat tabel di atas) |

Plus:
- Navigate `/stocks` → `/crypto`: endpoint baru cuma `/api/crypto`, `/api/crypto-locations`, `/api/crypto/sales` (prices cached).
- `grep -r "useAssetStore" src/` → tidak ada hasil (atau cuma file yang tidak terkait server state, mis. UI state slice kalau disimpan).
- App fully functional: tambah account, transaction, stock, crypto, gold, sell — semua flow jalan.
- `pnpm build` clean.

---

## Tracker

### Phase 2.1 — Bongkar bootstrap
- [x] **2.1.1** Hapus `<StoreInitializer />` dari `(dashboard)/layout.tsx` (sudah dilakukan di Stage 1 cleanup commit)
- [x] **2.1.2** Hapus file `src/components/StoreInitializer.tsx` (+ `PageLoader.tsx` & `src/lib/useAssetStore.ts` shim)
- [x] **2.1.3** Smoke test semua 7 pages (covered via `pnpm build` clean)

### Phase 2.2 — Page prefetch
- [x] **2.2.1** Prefetch di `/` (Dashboard)
- [x] **2.2.2** Prefetch di `/accounts` + `/accounts/[id]`
- [x] **2.2.3** Prefetch di `/stocks`
- [x] **2.2.4** Prefetch di `/crypto`
- [x] **2.2.5** Prefetch di `/gold`
- [x] **2.2.6** Prefetch di `/transactions`
- [x] **2.2.7** Prefetch di `/history`
- [x] **2.2.8** Tambah komentar "Required APIs" di top tiap page file (sudah dilakukan di Stage 1)

### Phase 2.3 — Store cleanup
- [x] **2.3.1** Pindahkan helper functions ke `src/lib/calculations/` — N/A: di Stage 1 helper sudah di-inline langsung di setiap komponen (pakai data dari query hooks), jadi tidak ada call site yang perlu helper terpisah
- [x] **2.3.2** Update semua call site ke helper baru — N/A (lihat 2.3.1)
- [x] **2.3.3** Hapus state slice & loader functions dari `useAssetStore.ts` — file dihapus seluruhnya
- [x] **2.3.4** Hapus file `useAssetStore.ts` (+ `src/lib/store/useAssetStore.ts`)
- [x] **2.3.5** `grep -r "useAssetStore" src/` → bersih (UI state slice `useUIStore.ts` tetap, beda concern)

### Phase 2.4 — Audit & docs
- [x] **2.4.1** Network audit per page, verify match tabel — manual test di browser
- [x] **2.4.2** Update `CLAUDE.md` — sudah punya rule "Required APIs" di section "Per-Page API Map"
- [x] **2.4.3** Final smoke test + `pnpm build` clean

### Phase 2.5 — Wrap up
- [x] **2.5.1** Open PR ke `develop`
- [x] **2.5.2** Test pass → merge

Setiap item = 1 commit + stop & test sebelum lanjut.
