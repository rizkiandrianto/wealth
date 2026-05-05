import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { wealthAccounts } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(wealthAccounts).where(eq(wealthAccounts.userId, userId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, type, currency } = body

  if (!name || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const [row] = await db
    .insert(wealthAccounts)
    .values({ userId, name, type, currency: currency ?? 'IDR' })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
