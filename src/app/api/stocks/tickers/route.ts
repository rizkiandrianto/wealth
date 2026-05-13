import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { assetPrices, stockHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      ticker: stockHoldings.ticker,
      market: stockHoldings.market,
      avgCost: sql<string | null>`SUM(${stockHoldings.quantity} * ${stockHoldings.averagePrice}) / NULLIF(SUM(${stockHoldings.quantity}), 0)`,
      price: assetPrices.price,
      currency: assetPrices.currency,
    })
    .from(stockHoldings)
    .leftJoin(assetPrices, eq(stockHoldings.ticker, assetPrices.ticker))
    .where(eq(stockHoldings.userId, userId))
    .groupBy(stockHoldings.ticker, stockHoldings.market, assetPrices.price, assetPrices.currency)

  return NextResponse.json(
    rows.map((r) => {
      const avgCost = Number(r.avgCost ?? 0)
      const price = Number(r.price ?? 0)
      const changePercentage = avgCost > 0 && price > 0 ? ((price - avgCost) / avgCost) * 100 : null
      return {
        ticker: r.ticker,
        market: r.market,
        avgCost,
        price,
        currency: r.currency ?? 'IDR',
        changePercentage,
      }
    })
  )
}
