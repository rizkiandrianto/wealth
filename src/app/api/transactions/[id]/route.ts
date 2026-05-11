import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq, sql } from 'drizzle-orm'
import { transactions, wealthAccounts } from '@/db/schema'
import { recomputeSnapshotsForward } from '@/lib/snapshot'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    if (!existing) return

    await tx
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    const dateStr = new Date(existing.date).toISOString().slice(0, 10)
    const amountStr = existing.amount

    if (existing.fromAccountId) {
      await tx
        .update(wealthAccounts)
        .set({ balance: sql`${wealthAccounts.balance} + ${amountStr}::numeric` })
        .where(eq(wealthAccounts.id, existing.fromAccountId))
      await recomputeSnapshotsForward(tx, userId, existing.fromAccountId, dateStr)
    }
    if (existing.toAccountId) {
      await tx
        .update(wealthAccounts)
        .set({ balance: sql`${wealthAccounts.balance} - ${amountStr}::numeric` })
        .where(eq(wealthAccounts.id, existing.toAccountId))
      await recomputeSnapshotsForward(tx, userId, existing.toAccountId, dateStr)
    }
  })

  return new NextResponse(null, { status: 204 })
}
