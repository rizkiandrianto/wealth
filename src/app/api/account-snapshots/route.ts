import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { asc, eq } from 'drizzle-orm'
import { accountBalanceSnapshots } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      accountId: accountBalanceSnapshots.accountId,
      date: accountBalanceSnapshots.date,
      balance: accountBalanceSnapshots.balance,
      updatedAt: accountBalanceSnapshots.updatedAt,
    })
    .from(accountBalanceSnapshots)
    .where(eq(accountBalanceSnapshots.userId, userId))
    .orderBy(asc(accountBalanceSnapshots.date))

  return NextResponse.json(rows)
}
