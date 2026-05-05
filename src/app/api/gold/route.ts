import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { goldHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(goldHoldings).where(eq(goldHoldings.userId, userId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, weight, purchasePrice, purchaseDate } = body

  if (!locationId || !weight || !purchasePrice || !purchaseDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [row] = await db
    .insert(goldHoldings)
    .values({
      userId,
      locationId,
      weight: String(weight),
      purchasePrice: String(purchasePrice),
      purchaseDate: new Date(purchaseDate),
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
