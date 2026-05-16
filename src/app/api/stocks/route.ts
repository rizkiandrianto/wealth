import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { stockHoldings } from '@/db/schema'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(stockHoldings).where(eq(stockHoldings.userId, userId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { locationId, ticker, market, quantity, averagePrice, purchaseDate } = body

  if (!locationId || !ticker || !quantity || !averagePrice || !purchaseDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const normalizedMarket = market === 'US' ? 'US' : 'IDX'

  const [row] = await db
    .insert(stockHoldings)
    .values({
      userId,
      locationId,
      ticker,
      market: normalizedMarket,
      quantity: String(quantity),
      averagePrice: String(averagePrice),
      purchaseDate: new Date(purchaseDate),
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
