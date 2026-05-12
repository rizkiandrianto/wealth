import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { asc, eq } from 'drizzle-orm'
import { portfolioValueSnapshots } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    .where(eq(portfolioValueSnapshots.userId, userId))
    .orderBy(asc(portfolioValueSnapshots.date))

  return NextResponse.json(rows)
}
