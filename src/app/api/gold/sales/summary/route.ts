import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { count, eq, sql, sum } from 'drizzle-orm'
import { goldSales } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [row] = await db
    .select({
      totalRealizedPnL: sql<string | null>`${sum(goldSales.realizedPnl)}`,
      count: count(),
    })
    .from(goldSales)
    .where(eq(goldSales.userId, userId))

  return NextResponse.json({
    totalRealizedPnL: Number(row?.totalRealizedPnL ?? 0),
    count: Number(row?.count ?? 0),
  })
}
