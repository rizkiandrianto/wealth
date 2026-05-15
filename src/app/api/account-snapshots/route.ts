import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, asc, eq, gte } from 'drizzle-orm'
import { accountBalanceSnapshots } from '@/db/schema'
import { parseSnapshotRange, rangeStartDate } from '@/lib/snapshot'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = parseSnapshotRange(req.nextUrl.searchParams.get('range'))
  const fromDate = rangeStartDate(range)

  const whereClause = fromDate
    ? and(eq(accountBalanceSnapshots.userId, userId), gte(accountBalanceSnapshots.date, fromDate))
    : eq(accountBalanceSnapshots.userId, userId)

  const rows = await db
    .select({
      accountId: accountBalanceSnapshots.accountId,
      date: accountBalanceSnapshots.date,
      balance: accountBalanceSnapshots.balance,
      updatedAt: accountBalanceSnapshots.updatedAt,
    })
    .from(accountBalanceSnapshots)
    .where(whereClause)
    .orderBy(asc(accountBalanceSnapshots.date))

  return NextResponse.json(rows)
}
