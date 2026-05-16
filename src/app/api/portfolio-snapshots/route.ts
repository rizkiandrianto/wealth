import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, asc, eq, gte } from 'drizzle-orm'
import { portfolioValueSnapshots } from '@/db/schema'
import { parseSnapshotRange, rangeStartDate } from '@/lib/snapshot'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = parseSnapshotRange(req.nextUrl.searchParams.get('range'))
  const fromDate = rangeStartDate(range)

  const whereClause = fromDate
    ? and(eq(portfolioValueSnapshots.userId, userId), gte(portfolioValueSnapshots.date, fromDate))
    : eq(portfolioValueSnapshots.userId, userId)

  const rows = await db
    .select({
      date: portfolioValueSnapshots.date,
      cashValue: portfolioValueSnapshots.cashValue,
      stockValue: portfolioValueSnapshots.stockValue,
      cryptoValue: portfolioValueSnapshots.cryptoValue,
      goldValue: portfolioValueSnapshots.goldValue,
      totalValue: portfolioValueSnapshots.totalValue,
      updatedAt: portfolioValueSnapshots.updatedAt,
    })
    .from(portfolioValueSnapshots)
    .where(whereClause)
    .orderBy(asc(portfolioValueSnapshots.date))

  return NextResponse.json(rows)
}
