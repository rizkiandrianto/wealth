import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { assetPrices, cryptoHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      symbol: cryptoHoldings.symbol,
      avgCost: sql<string | null>`SUM(${cryptoHoldings.quantity} * ${cryptoHoldings.averagePrice}) / NULLIF(SUM(${cryptoHoldings.quantity}), 0)`,
      price: assetPrices.price,
      currency: assetPrices.currency,
    })
    .from(cryptoHoldings)
    .leftJoin(assetPrices, eq(cryptoHoldings.symbol, assetPrices.ticker))
    .where(eq(cryptoHoldings.userId, userId))
    .groupBy(cryptoHoldings.symbol, assetPrices.price, assetPrices.currency)

  return NextResponse.json(
    rows.map((r) => {
      const avgCost = Number(r.avgCost ?? 0)
      const price = Number(r.price ?? 0)
      const changePercentage = avgCost > 0 && price > 0 ? ((price - avgCost) / avgCost) * 100 : null
      return {
        symbol: r.symbol,
        avgCost,
        price,
        currency: r.currency ?? 'IDR',
        changePercentage,
      }
    })
  )
}
