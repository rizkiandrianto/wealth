import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { assetPrices, cryptoHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [row] = await db
    .select({
      totalValue: sql<string | null>`SUM(${cryptoHoldings.quantity} * ${assetPrices.price})`,
      totalCost: sql<string | null>`SUM(${cryptoHoldings.quantity} * ${cryptoHoldings.averagePrice})`,
      uniqueCount: sql<string | null>`COUNT(DISTINCT ${cryptoHoldings.symbol})`,
    })
    .from(cryptoHoldings)
    .leftJoin(assetPrices, eq(cryptoHoldings.symbol, assetPrices.ticker))
    .where(eq(cryptoHoldings.userId, userId))

  return NextResponse.json({
    totalValue: Number(row?.totalValue ?? 0),
    totalCost: Number(row?.totalCost ?? 0),
    uniqueCount: Number(row?.uniqueCount ?? 0),
  })
}
