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
      totalCost: sql<string | null>`SUM(${goldHoldings.weight} * ${goldHoldings.purchasePrice})`,
    })
    .from(goldHoldings)
    .where(eq(goldHoldings.userId, userId))

  const [priceRow] = await db
    .select({ price: assetPrices.price })
    .from(assetPrices)
    .where(eq(assetPrices.ticker, 'XAU'))

  const totalWeight = Number(agg?.totalWeight ?? 0)
  const totalCost = Number(agg?.totalCost ?? 0)
  const goldPrice = Number(priceRow?.price ?? 0)

  return NextResponse.json({
    totalValue: totalWeight * goldPrice,
    totalCost,
    totalWeight,
    goldPrice,
  })
}
