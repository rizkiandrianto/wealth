/**
 * Generate historical snapshots for the demo user:
 *   - account_balance_snapshots: replayed daily from seeded transactions
 *   - portfolio_value_snapshots: synthetic random-walk prices × holdings
 *
 * Deterministic (seeded RNG): every fresh `pnpm seed:demo:reset && pnpm seed:demo`
 * produces the same price series, so the demo chart looks consistent.
 *
 * Prices are random-walked BACKWARD from a hardcoded "today" anchor per
 * ticker, with daily log-normal returns (drift + Gaussian shock). This is
 * independent of `asset_prices` — that table is populated by the scheduler
 * and contains only the current price; historical prices for chart purposes
 * live in `portfolio_value_snapshots`.
 */

import { eq } from 'drizzle-orm'
import type { db } from '../../src/db'
import {
  accountBalanceSnapshots,
  cryptoHoldings,
  cryptoSales,
  goldHoldings,
  goldSales,
  portfolioValueSnapshots,
  stockHoldings,
  stockSales,
  transactions,
  wealthAccounts,
} from '../../src/db/schema'

type DbOrTx = Pick<typeof db, 'select' | 'insert'>

const SNAPSHOT_DAYS = 365
const APP_TZ = 'Asia/Jakarta'

interface PriceConfig {
  anchorPrice: number
  dailyVol: number
  annualDrift: number
}

// Hardcoded "today" anchors. Walked backward over SNAPSHOT_DAYS days.
// Stocks: IDR per share (US tickers stored at ~16,000 USD/IDR conversion).
// Crypto: IDR per coin. Gold: IDR per gram.
const PRICE_ANCHORS: Record<string, PriceConfig> = {
  BBCA: { anchorPrice: 10500, dailyVol: 0.012, annualDrift: 0.08 },
  PTBA: { anchorPrice: 3100, dailyVol: 0.018, annualDrift: 0.04 },
  BBRI: { anchorPrice: 4900, dailyVol: 0.014, annualDrift: 0.06 },
  AAPL: { anchorPrice: 3840000, dailyVol: 0.018, annualDrift: 0.15 },
  NVDA: { anchorPrice: 2400000, dailyVol: 0.035, annualDrift: 0.30 },
  TSLA: { anchorPrice: 4800000, dailyVol: 0.040, annualDrift: 0.10 },
  BTC: { anchorPrice: 1700000000, dailyVol: 0.035, annualDrift: 0.45 },
  ETH: { anchorPrice: 65000000, dailyVol: 0.045, annualDrift: 0.30 },
  SOL: { anchorPrice: 3500000, dailyVol: 0.055, annualDrift: 0.50 },
  XAU: { anchorPrice: 1450000, dailyVol: 0.008, annualDrift: 0.12 },
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rnd: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = rnd()
  while (v === 0) v = rnd()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function strSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) || 1
}

const APP_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function appDate(d: Date): string {
  return APP_DATE_FMT.format(d)
}

function randomWalkBackward(cfg: PriceConfig, days: number, seed: number): number[] {
  const rnd = mulberry32(seed)
  const dailyDrift = cfg.annualDrift / 365
  const prices = new Array<number>(days)
  prices[days - 1] = cfg.anchorPrice
  for (let i = days - 1; i > 0; i--) {
    const shock = dailyDrift + cfg.dailyVol * gaussian(rnd)
    prices[i - 1] = prices[i] / Math.exp(shock)
  }
  return prices
}

async function batchInsert<T extends Record<string, unknown>>(
  tx: DbOrTx,
  rows: T[],
  insertFn: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insertFn(rows.slice(i, i + CHUNK))
  }
}

export async function seedSnapshots(
  tx: DbOrTx,
  userId: string,
): Promise<{ accountSnapshots: number; portfolioSnapshots: number }> {
  const [
    accountsRows,
    stocksRows,
    cryptosRows,
    goldsRows,
    txsRows,
    stockSalesRows,
    cryptoSalesRows,
    goldSalesRows,
  ] = await Promise.all([
    tx.select().from(wealthAccounts).where(eq(wealthAccounts.userId, userId)),
    tx.select().from(stockHoldings).where(eq(stockHoldings.userId, userId)),
    tx.select().from(cryptoHoldings).where(eq(cryptoHoldings.userId, userId)),
    tx.select().from(goldHoldings).where(eq(goldHoldings.userId, userId)),
    tx.select().from(transactions).where(eq(transactions.userId, userId)),
    tx.select().from(stockSales).where(eq(stockSales.userId, userId)),
    tx.select().from(cryptoSales).where(eq(cryptoSales.userId, userId)),
    tx.select().from(goldSales).where(eq(goldSales.userId, userId)),
  ])

  // Date window: [today - SNAPSHOT_DAYS + 1 .. today], oldest first.
  const today = new Date()
  const dates: string[] = []
  for (let i = SNAPSHOT_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(appDate(d))
  }

  // Per-ticker random-walk price series (length = SNAPSHOT_DAYS, dates-aligned).
  const tickerSeries = new Map<string, number[]>()
  for (const [ticker, cfg] of Object.entries(PRICE_ANCHORS)) {
    tickerSeries.set(ticker, randomWalkBackward(cfg, SNAPSHOT_DAYS, strSeed(ticker)))
  }

  // ── Account balance snapshots: replay transactions per day ──────────────
  const accountSnapshotRows = accountsRows.flatMap((account) => {
    const affectsAccount = txsRows.some(
      (t) => t.fromAccountId === account.id || t.toAccountId === account.id,
    )
    const currentBalance = Number(account.balance)
    return dates.map((snapDate) => {
      let balance: number
      if (affectsAccount) {
        balance = 0
        for (const t of txsRows) {
          if (appDate(new Date(t.date)) > snapDate) continue
          if (t.toAccountId === account.id) balance += Number(t.amount)
          if (t.fromAccountId === account.id) balance -= Number(t.amount)
        }
      } else {
        // Account seeded with a starting balance and no transactions — hold flat.
        balance = currentBalance
      }
      return {
        userId,
        accountId: account.id,
        date: snapDate,
        balance: balance.toFixed(4),
      }
    })
  })

  await batchInsert(tx, accountSnapshotRows, (chunk) =>
    tx.insert(accountBalanceSnapshots).values(chunk).onConflictDoNothing(),
  )

  // Cash per (date) — pre-aggregate so portfolio loop is O(days) not O(days×accounts).
  const cashByDate = new Map<string, number>()
  for (const row of accountSnapshotRows) {
    cashByDate.set(row.date, (cashByDate.get(row.date) ?? 0) + Number(row.balance))
  }

  // Sale tallies pre-grouped by holding id so we can subtract qty held at
  // snapshot date. Stock/crypto sales store quantity under `quantity`; gold
  // sales store grams sold under `weight`.
  type SaleRow = Record<string, unknown> & { saleDate: Date | string }
  function groupSales(
    rows: SaleRow[],
    idKey: 'stockId' | 'cryptoId' | 'goldId',
    qtyKey: 'quantity' | 'weight',
  ): Map<string, { date: string; qty: number }[]> {
    const m = new Map<string, { date: string; qty: number }[]>()
    for (const r of rows) {
      const id = r[idKey] as string
      const arr = m.get(id) ?? []
      arr.push({ date: appDate(new Date(r.saleDate)), qty: Number(r[qtyKey]) })
      m.set(id, arr)
    }
    return m
  }
  const stockSalesByHolding = groupSales(stockSalesRows, 'stockId', 'quantity')
  const cryptoSalesByHolding = groupSales(cryptoSalesRows, 'cryptoId', 'quantity')
  const goldSalesByHolding = groupSales(goldSalesRows, 'goldId', 'weight')

  function qtyAt(
    purchaseDate: Date | string,
    originalQty: string,
    holdingId: string,
    salesIndex: Map<string, { date: string; qty: number }[]>,
    snapDate: string,
  ): number {
    if (appDate(new Date(purchaseDate)) > snapDate) return 0
    let qty = Number(originalQty)
    const sales = salesIndex.get(holdingId) ?? []
    for (const s of sales) {
      if (s.date <= snapDate) qty -= s.qty
    }
    return Math.max(0, qty)
  }

  // ── Portfolio value snapshots ───────────────────────────────────────────
  const portfolioRows = dates.map((snapDate, idx) => {
    let stockTotal = 0
    for (const sh of stocksRows) {
      const series = tickerSeries.get(sh.ticker)
      if (!series) continue
      const qty = qtyAt(sh.purchaseDate, sh.quantity, sh.id, stockSalesByHolding, snapDate)
      if (qty === 0) continue
      const multiplier = sh.market === 'IDX' ? 100 : 1
      stockTotal += qty * multiplier * series[idx]
    }

    let cryptoTotal = 0
    for (const ch of cryptosRows) {
      const series = tickerSeries.get(ch.symbol)
      if (!series) continue
      const qty = qtyAt(ch.purchaseDate, ch.quantity, ch.id, cryptoSalesByHolding, snapDate)
      if (qty === 0) continue
      cryptoTotal += qty * series[idx]
    }

    let goldTotal = 0
    const xauSeries = tickerSeries.get('XAU')
    if (xauSeries) {
      const priceXAU = xauSeries[idx]
      for (const gh of goldsRows) {
        const qty = qtyAt(gh.purchaseDate, gh.weight, gh.id, goldSalesByHolding, snapDate)
        if (qty === 0) continue
        goldTotal += qty * priceXAU
      }
    }

    const cash = cashByDate.get(snapDate) ?? 0
    const total = cash + stockTotal + cryptoTotal + goldTotal
    return {
      userId,
      date: snapDate,
      cashValue: cash.toFixed(4),
      stockValue: stockTotal.toFixed(4),
      cryptoValue: cryptoTotal.toFixed(4),
      goldValue: goldTotal.toFixed(4),
      totalValue: total.toFixed(4),
    }
  })

  await batchInsert(tx, portfolioRows, (chunk) =>
    tx.insert(portfolioValueSnapshots).values(chunk).onConflictDoNothing(),
  )

  return {
    accountSnapshots: accountSnapshotRows.length,
    portfolioSnapshots: portfolioRows.length,
  }
}
