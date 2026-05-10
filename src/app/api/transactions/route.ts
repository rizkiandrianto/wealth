import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { transactions } from '@/db/schema'

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

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      fromAccountId: fromAccountId ?? null,
      toAccountId: toAccountId ?? null,
      amount: String(amount),
      description: description ?? null,
      date: new Date(date),
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
