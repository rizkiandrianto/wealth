import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { cryptoHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(cryptoHoldings).where(eq(cryptoHoldings.userId, userId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, symbol, name, quantity, averagePrice, currentPrice, purchaseDate } = body

  if (!locationId || !symbol || !name || !quantity || !averagePrice || !purchaseDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [row] = await db
    .insert(cryptoHoldings)
    .values({
      userId,
      locationId,
      symbol,
      name,
      quantity: String(quantity),
      averagePrice: String(averagePrice),
      currentPrice: String(currentPrice ?? 0),
      purchaseDate: new Date(purchaseDate),
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
