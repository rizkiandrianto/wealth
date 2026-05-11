import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { desc, eq, sql } from 'drizzle-orm'
import { transactions, wealthAccounts } from '@/db/schema'
import { recomputeSnapshotsForward } from '@/lib/snapshot'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fromAccountId, toAccountId, amount, description, date } = body

  if (!amount || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const txDate = new Date(date)
  const dateStr = txDate.toISOString().slice(0, 10)
  const amountStr = String(amount)

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(transactions)
      .values({
        userId,
        fromAccountId: fromAccountId ?? null,
        toAccountId: toAccountId ?? null,
        amount: amountStr,
        description: description ?? null,
        date: txDate,
      })
      .returning()

    if (fromAccountId) {
      await tx
        .update(wealthAccounts)
        .set({ balance: sql`${wealthAccounts.balance} - ${amountStr}::numeric` })
        .where(eq(wealthAccounts.id, fromAccountId))
      await recomputeSnapshotsForward(tx, userId, fromAccountId, dateStr)
    }
    if (toAccountId) {
      await tx
        .update(wealthAccounts)
        .set({ balance: sql`${wealthAccounts.balance} + ${amountStr}::numeric` })
        .where(eq(wealthAccounts.id, toAccountId))
      await recomputeSnapshotsForward(tx, userId, toAccountId, dateStr)
    }

    return row
  })

  return NextResponse.json(result, { status: 201 })
}
