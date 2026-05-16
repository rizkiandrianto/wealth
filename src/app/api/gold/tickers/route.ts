import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { assetPrices, goldHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [agg] = await db
    .select({
      totalWeight: sql<string | null>`SUM(${goldHoldings.weight})`,
      avgCost: sql<string | null>`SUM(${goldHoldings.weight} * ${goldHoldings.purchasePrice}) / NULLIF(SUM(${goldHoldings.weight}), 0)`,
    })
    .from(goldHoldings)
    .where(eq(goldHoldings.userId, userId))

  const totalWeight = Number(agg?.totalWeight ?? 0)
  if (totalWeight === 0) return NextResponse.json(null)

  const [priceRow] = await db
    .select({ price: assetPrices.price, currency: assetPrices.currency })
    .from(assetPrices)
    .where(eq(assetPrices.ticker, 'XAU'))

  const avgCost = Number(agg?.avgCost ?? 0)
  const price = Number(priceRow?.price ?? 0)
  const changePercentage = avgCost > 0 && price > 0 ? ((price - avgCost) / avgCost) * 100 : null

  return NextResponse.json({
    totalWeight,
    avgCost,
    price,
    currency: priceRow?.currency ?? 'IDR',
    changePercentage,
  })
}
