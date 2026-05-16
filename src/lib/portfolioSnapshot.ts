import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  assetPrices,
  cryptoHoldings,
  goldHoldings,
  portfolioValueSnapshots,
  stockHoldings,
  wealthAccounts,
} from '@/db/schema'

type DbOrTx = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete'>

export interface PortfolioBreakdown {
  cashValue: string
  stockValue: string
  cryptoValue: string
  goldValue: string
  totalValue: string
}

async function sumCash(tx: DbOrTx, userId: string): Promise<string> {
  const [row] = await tx
    .select({ total: sql<string>`COALESCE(SUM(${wealthAccounts.balance}), 0)` })
    .from(wealthAccounts)
    .where(eq(wealthAccounts.userId, userId))
  return row?.total ?? '0'
}

async function sumStock(tx: DbOrTx, userId: string): Promise<string> {
  // IDX: quantity stored in lots, 1 lot = 100 shares. US: quantity = shares.
  const [row] = await tx
    .select({
      total: sql<string>`COALESCE(SUM(
        (CASE WHEN ${stockHoldings.market} = 'IDX' THEN ${stockHoldings.quantity} * 100 ELSE ${stockHoldings.quantity} END)
        * COALESCE(${assetPrices.price}, 0)
      ), 0)`,
    })
    .from(stockHoldings)
    .leftJoin(assetPrices, eq(assetPrices.ticker, stockHoldings.ticker))
    .where(eq(stockHoldings.userId, userId))
  return row?.total ?? '0'
}

async function sumCrypto(tx: DbOrTx, userId: string): Promise<string> {
  const [row] = await tx
    .select({
      total: sql<string>`COALESCE(SUM(${cryptoHoldings.quantity} * COALESCE(${assetPrices.price}, 0)), 0)`,
    })
    .from(cryptoHoldings)
    .leftJoin(assetPrices, eq(assetPrices.ticker, cryptoHoldings.symbol))
    .where(eq(cryptoHoldings.userId, userId))
  return row?.total ?? '0'
}

async function sumGold(tx: DbOrTx, userId: string): Promise<string> {
  // Gold price stored under ticker 'XAU' (IDR per gram).
  const [row] = await tx
    .select({
      total: sql<string>`COALESCE(SUM(${goldHoldings.weight} * COALESCE(${assetPrices.price}, 0)), 0)`,
    })
    .from(goldHoldings)
    .leftJoin(assetPrices, eq(assetPrices.ticker, sql`'XAU'`))
    .where(eq(goldHoldings.userId, userId))
  return row?.total ?? '0'
}

function addNumericStrings(...values: string[]): string {
  const sum = values.reduce((acc, v) => acc + Number(v || '0'), 0)
  return sum.toString()
}

export async function computePortfolioForUser(
  tx: DbOrTx,
  userId: string,
): Promise<PortfolioBreakdown> {
  const [cashValue, stockValue, cryptoValue, goldValue] = await Promise.all([
    sumCash(tx, userId),
    sumStock(tx, userId),
    sumCrypto(tx, userId),
    sumGold(tx, userId),
  ])
  const totalValue = addNumericStrings(cashValue, stockValue, cryptoValue, goldValue)
  return { cashValue, stockValue, cryptoValue, goldValue, totalValue }
}

export async function upsertPortfolioSnapshot(
  tx: DbOrTx,
  userId: string,
  date: string,
): Promise<void> {
  const breakdown = await computePortfolioForUser(tx, userId)
  await tx
    .insert(portfolioValueSnapshots)
    .values({ userId, date, ...breakdown })
    .onConflictDoUpdate({
      target: [portfolioValueSnapshots.userId, portfolioValueSnapshots.date],
      set: { ...breakdown, updatedAt: new Date() },
    })
}
