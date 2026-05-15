# History API with Range + Portfolio History on /history

## Context

Portfolio snapshot infrastructure is landed (`plan/portfolio-snapshot.md` — all phases complete): `portfolio_value_snapshots` stores per-day cash/stock/crypto/gold/total breakdown, populated daily via `/api/portfolio-snapshots/update`. The read endpoint at `src/app/api/portfolio-snapshots/route.ts` exists but returns **all** rows unfiltered. Same story for `src/app/api/account-snapshots/route.ts` — also returns every row. The `/history` page currently visualizes only account balances (via `BalanceChart` + `/api/account-snapshots`), with client-side filtering after the full payload arrives — portfolio history isn't surfaced anywhere in the UI.

This plan does three things:
1. Adds server-side range filtering to **both** `/api/portfolio-snapshots` and `/api/account-snapshots` (shared helper, default 3 months) so we stop shipping the full history on every page load.
2. Adds a new Portfolio tab to `/history` with its own range selector (1M/3M/6M/1Y/YTD/All).
3. Adds the same range selector to the existing Accounts tab.

Closes the gap flagged in `plan/per-page-api.md` for the History page ("kalau Portfolio Snapshot plan sudah landed").

## User decisions

- **Layout**: tabs `Portfolio | Accounts` inside `/history` (Portfolio default). Accounts tab keeps existing `BalanceChart` + `HistoryTable` + date popover + day/month/year toggle untouched.
- **Series**: Total + toggle to per-asset-class breakdown (cash/stock/crypto/gold), mirroring `BalanceChart`'s Total / Per-Account toggle pattern.
- **Range presets**: `1m | 3m | 6m | 1y | ytd | all`, default `3m`.

## Working Agreement

- **Branch**: `feat/history-api` cut from `develop`.
- **Per sub-step di tracker = 1 commit**. AI stop & tawarkan commit + test setelah tiap sub-step.
- Test pass → lanjut. Test fail → fix dulu, baru commit.

---

## Approach

Six movements:
1. **Shared range helper** — extract a tiny `parseSnapshotRange(req)` + `rangeStartDate(range)` utility used by both snapshot endpoints. Default `3m`, Jakarta TZ math.
2. **API enhancement (both endpoints)** — add range filter to `/api/portfolio-snapshots` AND `/api/account-snapshots`. Response shapes unchanged; only row sets narrow.
3. **Query hook parameterization** — convert `usePortfolioSnapshotsQuery` and `useAccountSnapshotsQuery` to accept `range`, convert their `queryKeys.*` entries to factories.
4. **Tabs scaffolding** — install shadcn `Tabs` if missing; restructure `/history` into Portfolio | Accounts.
5. **New chart component** — `PortfolioHistoryChart` with range buttons + total/breakdown toggle, styled like `BalanceChart`.
6. **Accounts tab range buttons + docs** — add the same 1M/3M/6M/1Y/YTD/All button group to the Accounts tab driving `useAccountSnapshotsQuery(range)`. Keep the existing date popover + day/month/year toggle as client-side refinement on top. Update `plan/per-page-api.md`.

---

## Files to Modify

### Phase HA.1 — Shared range helper

**File**: `src/lib/snapshot.ts` (extend existing file — already exports `appDateStr` + `APP_TZ`)

Add and export:
```ts
export type SnapshotRange = '1m' | '3m' | '6m' | '1y' | 'ytd' | 'all'

const VALID: ReadonlySet<string> = new Set(['1m','3m','6m','1y','ytd','all'])
export function parseSnapshotRange(input: string | null | undefined): SnapshotRange {
  const v = (input ?? '').toLowerCase()
  return (VALID.has(v) ? v : '3m') as SnapshotRange
}

// Returns YYYY-MM-DD cutoff in Asia/Jakarta, or null for 'all'.
export function rangeStartDate(range: SnapshotRange, now: Date = new Date()): string | null {
  if (range === 'all') return null
  if (range === 'ytd') {
    const jakartaYear = appDateStr(now).slice(0, 4)
    return `${jakartaYear}-01-01`
  }
  const d = new Date(now)
  if (range === '1m') d.setMonth(d.getMonth() - 1)
  else if (range === '3m') d.setMonth(d.getMonth() - 3)
  else if (range === '6m') d.setMonth(d.getMonth() - 6)
  else if (range === '1y') d.setFullYear(d.getFullYear() - 1)
  return appDateStr(d)
}
```

Why here: `snapshot.ts` already owns Jakarta-TZ date formatting and is imported by both snapshot routes; new helpers belong with their kin.

### Phase HA.2 — API range filter (both endpoints)

**Files**:
- `src/app/api/portfolio-snapshots/route.ts`
- `src/app/api/account-snapshots/route.ts`

Both routes get the same change:
```ts
const range = parseSnapshotRange(req.nextUrl.searchParams.get('range'))
const fromDate = rangeStartDate(range)
const whereClause = fromDate
  ? and(eq(table.userId, userId), gte(table.date, fromDate))
  : eq(table.userId, userId)
```

- Both currently use `GET()` (no `req` arg). Change signature to `GET(req: NextRequest)` to access query params (matches the pattern in `src/app/api/market/prices/update/route.ts`).
- Text comparison on `YYYY-MM-DD` is sort-safe; `gte` works.
- Response shapes unchanged. Just narrower row sets.
- Unknown/missing range → falls back to `3m` (forgiving, don't 400).

### Phase HA.3 — Query hook + key factories

**Files**:
- `src/lib/queries/keys.ts`
- `src/lib/queries/portfolioSnapshots.ts`
- `src/lib/queries/accountSnapshots.ts`

- Import `SnapshotRange` from `@/lib/snapshot` (re-export from both query files for ergonomic imports).
- `keys.ts`: convert both entries:
  - `portfolioSnapshots: (range: SnapshotRange) => ['portfolioSnapshots', range] as const`
  - `accountSnapshots: (range: SnapshotRange) => ['accountSnapshots', range] as const`
- `portfolioSnapshotsQueryOptions(range: SnapshotRange = '3m')` and `usePortfolioSnapshotsQuery(range?: SnapshotRange)` pass `?range=${range}` to `apiFetch`.
- Same for `accountSnapshotsQueryOptions` / `useAccountSnapshotsQuery`.
- `grep -rn "queryKeys\.(portfolioSnapshots|accountSnapshots)\|(portfolioSnapshots|accountSnapshots)QueryOptions\|use(Portfolio|Account)SnapshotsQuery" src/` — fix every caller TypeScript surfaces (notably `src/app/(dashboard)/history/page.tsx` prefetch + usage).

### Phase HA.4 — shadcn Tabs

**File**: `src/components/ui/tabs.tsx`

- Check if it exists. If not: `pnpm dlx shadcn@latest add tabs` (project already uses shadcn — Card, Button, Popover, Calendar, Checkbox, Skeleton all live under `src/components/ui/*`).

### Phase HA.5 — `PortfolioHistoryChart` component

**File**: `src/components/PortfolioHistoryChart.tsx` (new)

Self-contained client component. Owns:
- `range: PortfolioRange` state (default `'3m'`).
- `mode: 'total' | 'breakdown'` state.
- `const { data = [], isLoading } = usePortfolioSnapshotsQuery(range)` — refetches when range changes (separate cache entry per range key).

Visual structure (mirrors `BalanceChart.tsx`):
```
[Title: Portfolio Value Trend]                    [Total | Breakdown]
[Range buttons: 1M  3M  6M  1Y  YTD  All]
<ResponsiveContainer height={400}>
  <LineChart>
    - mode='total':     single Line dataKey="totalValue" (color #3b82f6, primary)
    - mode='breakdown': 4 Lines — cashValue, stockValue, cryptoValue, goldValue
      (reuse the 4 colored-dot colors from PortfolioTotalCard for visual consistency — grep it for exact hex during impl)
  </LineChart>
</ResponsiveContainer>
```

Reuse `useFormatCurrency`, `formatDateShort`, `formatMonth`, `HIDDEN_VALUE_MASK` from `src/lib/format.ts` and `useUIStore` for `hideValues` masking — same imports as `BalanceChart.tsx:14-22`. Numeric values arrive as strings (Drizzle `numeric`); coerce via `parseFloat` or `num()` from `src/lib/normalizers.ts` when mapping into chart data.

X-axis label format: derive granularity from range — daily ticks for `1m`/`3m`, monthly for `6m`/`1y`/`ytd`, yearly for `all`. Recharts auto-thins ticks via `interval="preserveStartEnd"`.

Tooltip + grid + axis styling cloned from `BalanceChart.tsx:171-201` for consistency.

No date popover on Portfolio tab — range buttons are the only control.

Empty state: when `data.length === 0` show a centered "No portfolio history yet" card (mirror `history/page.tsx:194-196`).

### Phase HA.6 — `/history` page restructure

**File**: `src/app/(dashboard)/history/page.tsx`

- Lift a shared `accountsRange: SnapshotRange` state at page level (or inside the Accounts tab subtree) — default `'3m'`.
- Pass `accountsRange` to `useAccountSnapshotsQuery(accountsRange)` (used by `BalanceChart` + `HistoryTable`).
- Wrap content in shadcn `Tabs` defaulting to `portfolio`:
  ```tsx
  <Tabs defaultValue="portfolio">
    <TabsList> <TabsTrigger value="portfolio">Portfolio</TabsTrigger> <TabsTrigger value="accounts">Accounts</TabsTrigger> </TabsList>
    <TabsContent value="portfolio"><PortfolioHistoryChart /></TabsContent>
    <TabsContent value="accounts">
      <RangeButtons value={accountsRange} onChange={setAccountsRange} />
      {/* existing day/month/year toggle + date popover + BalanceChart + HistoryTable */}
    </TabsContent>
  </Tabs>
  ```
- The date popover + day/month/year toggle stay — they refine *within* the API-returned range (client-side). The date popover should clamp to the active range or auto-reset when range changes (simpler: just reset `range` popover state when `accountsRange` changes; ensures user doesn't end up with an empty filter from a stale popover selection).
- Update prefetches in the `useEffect`: `qc.prefetchQuery(portfolioSnapshotsQueryOptions('3m'))` and `qc.prefetchQuery(accountSnapshotsQueryOptions('3m'))`.
- Update the `// Required APIs:` comment at top of file to `GET /api/accounts`, `GET /api/account-snapshots?range=3m`, `GET /api/portfolio-snapshots?range=3m`.

**Range button group**: define inline (small component) or extract `src/components/RangeSelector.tsx` shared between both tabs. Recommend extracting — single source of truth for the 6 preset labels and their `SnapshotRange` mapping. Props: `value: SnapshotRange`, `onChange: (r: SnapshotRange) => void`.

### Phase HA.7 — Update per-page-api map

**File**: `plan/per-page-api.md`

- Line 85: change History row from `... /api/portfolio-snapshots (kalau Portfolio Snapshot plan sudah landed)` → `/api/accounts`, `/api/account-snapshots?range=3m`, `/api/portfolio-snapshots?range=3m`.
- Line 139: update verification table row for `/history` to expect 3 endpoints (not 2-3).

---

## Caveats

- **shadcn Tabs install**: only triggers if `src/components/ui/tabs.tsx` doesn't exist. Verify first; the CLI is generally safe but it does write to `components.json` and pull deps via package manager.
- **Existing callers of `queryKeys.portfolioSnapshots` / `queryKeys.accountSnapshots`**: switching to factories is a breaking signature change. TypeScript will flag any caller that uses the old constants directly (e.g. mutation `invalidateQueries`, prefetches). The known callsites are inside `history/page.tsx`; verify no others via grep during HA.3.
- **Numeric string coercion**: Drizzle `numeric` columns come back as strings. Charts need numbers. Convert at the boundary (in the query hook mapper, like `toStock`/`toCrypto`/`toSnapshot` patterns) — not inside the chart, so other consumers benefit.
- **Range arithmetic in Jakarta TZ**: subtracting months from a JS `Date` using `setMonth` then formatting via `appDateStr` works because `appDateStr` projects into Jakarta. Sanity-check around month-end. Jakarta is UTC+7, no DST.
- **Account snapshots are per-account, not per-user**: the Accounts tab's `BalanceChart` aggregates rows from multiple `accountId` values into daily balances via `buildDailyBalancesFromSnapshots`. Narrowing rows by date still works — fewer rows, same aggregation logic. No change to `buildDailyBalancesFromSnapshots`.
- **Date popover stale after range change**: when user picks `1M` then opens the calendar popover and selects a date outside that month, they'll see empty data. Mitigation: reset popover `range` state inside a `useEffect([accountsRange])` so it clears on range switch.
- **No mutation hooks affected**: snapshots are populated server-side via cron-style endpoints, not via UI mutations. No `invalidateQueries` flows to update.

---

## Verification

End-to-end manual:
1. `pnpm dev`, navigate `/history`.
2. Portfolio tab loads by default. Network tab: `GET /api/portfolio-snapshots?range=3m` + (prefetched) `GET /api/account-snapshots?range=3m` + `GET /api/accounts`.
3. Portfolio tab range buttons: click `1M` → `range=1m` request fires, chart re-renders. Click `All` → `range=all` fires.
4. Portfolio tab mode toggle: `Total` shows single line; `Breakdown` shows 4 colored lines (cash/stock/crypto/gold).
5. Accounts tab range buttons: same six presets. Default `3M`. Click `1Y` → `GET /api/account-snapshots?range=1y` fires, `BalanceChart` and `HistoryTable` reflect narrower/wider data.
6. Accounts tab: existing day/month/year aggregation toggle still works on top of the fetched range. Date popover still works as a fine-grained client-side filter; popover state resets when range button changes.
7. Toggle "hide values" (eye icon → `useUIStore`) → Y-axis labels mask on both tabs.
8. Empty state: with a user that has no snapshots, both tabs render empty cards.
9. API edge cases via curl, on both `/api/portfolio-snapshots` and `/api/account-snapshots`:
   - `?range=ytd` returns rows where `date >= YYYY-01-01` (Jakarta year).
   - `?range=foo` falls back to 3m (no 400).
   - No `range` param → defaults to 3m.
   - `?range=all` returns everything.
10. `pnpm build` clean (catches drift from `queryKeys.portfolioSnapshots` / `queryKeys.accountSnapshots` factory changes).

---

## Tracker

### Phase HA.1 — Shared range helper
- [ ] **HA.1.1** Add `SnapshotRange` type + `parseSnapshotRange` + `rangeStartDate` to `src/lib/snapshot.ts`; unit-test month-end edge cases (manual smoke)

### Phase HA.2 — API range filter (both endpoints)
- [ ] **HA.2.1** Apply range filter in `src/app/api/portfolio-snapshots/route.ts` (change `GET()` → `GET(req: NextRequest)`)
- [ ] **HA.2.2** Apply range filter in `src/app/api/account-snapshots/route.ts` (same change)
- [ ] **HA.2.3** Manual curl test both endpoints: all 6 presets + invalid + missing param

### Phase HA.3 — Query hook + key factories
- [ ] **HA.3.1** Convert `queryKeys.portfolioSnapshots` and `queryKeys.accountSnapshots` to factories in `src/lib/queries/keys.ts`
- [ ] **HA.3.2** Parameterize `portfolioSnapshotsQueryOptions` / `usePortfolioSnapshotsQuery` (re-export `SnapshotRange`)
- [ ] **HA.3.3** Parameterize `accountSnapshotsQueryOptions` / `useAccountSnapshotsQuery`
- [ ] **HA.3.4** `grep` + fix any TypeScript errors from factory signature changes; `pnpm build` clean

### Phase HA.4 — Tabs scaffolding
- [ ] **HA.4.1** Verify `src/components/ui/tabs.tsx` exists; if not, `pnpm dlx shadcn@latest add tabs`

### Phase HA.5 — `PortfolioHistoryChart` + `RangeSelector`
- [ ] **HA.5.1** Create `src/components/RangeSelector.tsx` (shared 6-button group; props: `value`, `onChange`)
- [ ] **HA.5.2** Create `src/components/PortfolioHistoryChart.tsx` skeleton with `RangeSelector` + mode toggle (no chart yet)
- [ ] **HA.5.3** Wire `usePortfolioSnapshotsQuery(range)`, map numeric strings → numbers
- [ ] **HA.5.4** Render Recharts `LineChart` for `total` mode
- [ ] **HA.5.5** Render multi-Line `breakdown` mode (cash/stock/crypto/gold), pick colors from `PortfolioTotalCard`
- [ ] **HA.5.6** Tooltip + axis styling + `hideValues` masking + empty state

### Phase HA.6 — `/history` page restructure
- [ ] **HA.6.1** Lift `accountsRange` state + thread into `useAccountSnapshotsQuery(accountsRange)`; reset date popover on range change
- [ ] **HA.6.2** Wrap content in `Tabs` (Portfolio default | Accounts) inside `src/app/(dashboard)/history/page.tsx`
- [ ] **HA.6.3** Mount `RangeSelector` on Accounts tab driving `accountsRange`
- [ ] **HA.6.4** Update prefetches (`portfolioSnapshotsQueryOptions('3m')`, `accountSnapshotsQueryOptions('3m')`) + update `// Required APIs:` comment

### Phase HA.7 — Docs
- [ ] **HA.7.1** Update History row + verification row in `plan/per-page-api.md`

### Phase HA.8 — Wrap up
- [ ] **HA.8.1** Final smoke test on `/history` (both tabs, all 6 ranges on each, breakdown toggle, date popover, empty state, hide-values)
- [ ] **HA.8.2** `pnpm build` clean
- [ ] **HA.8.3** Open PR to `develop`

Setiap item = 1 commit + stop & test sebelum lanjut.
