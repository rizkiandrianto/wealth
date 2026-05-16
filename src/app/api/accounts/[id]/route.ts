import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq, or } from 'drizzle-orm'
import { transactions, wealthAccounts } from '@/db/schema'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, type, currency } = body

  const [row] = await db
    .update(wealthAccounts)
    .set({ ...(name && { name }), ...(type && { type }), ...(currency && { currency }) })
    .where(and(eq(wealthAccounts.id, id), eq(wealthAccounts.userId, userId)))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await db.transaction(async (tx) => {
    await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          or(eq(transactions.fromAccountId, id), eq(transactions.toAccountId, id))
        )
      )

    await tx
      .delete(wealthAccounts)
      .where(and(eq(wealthAccounts.id, id), eq(wealthAccounts.userId, userId)))
  })

  return new NextResponse(null, { status: 204 })
}
