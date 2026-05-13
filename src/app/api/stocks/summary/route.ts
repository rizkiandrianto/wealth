import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { assetPrices, stockHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shares = sql`(CASE WHEN ${stockHoldings.market} = 'IDX' THEN ${stockHoldings.quantity} * 100 ELSE ${stockHoldings.quantity} END)`

  const [row] = await db
    .select({
      totalValue: sql<string | null>`SUM(${shares} * ${assetPrices.price})`,
      totalCost: sql<string | null>`SUM(${shares} * ${stockHoldings.averagePrice})`,
      uniqueCount: sql<string | null>`COUNT(DISTINCT ${stockHoldings.ticker})`,
    })
    .from(stockHoldings)
    .leftJoin(assetPrices, eq(stockHoldings.ticker, assetPrices.ticker))
    .where(eq(stockHoldings.userId, userId))

  return NextResponse.json({
    totalValue: Number(row?.totalValue ?? 0),
    totalCost: Number(row?.totalCost ?? 0),
    uniqueCount: Number(row?.uniqueCount ?? 0),
  })
}
