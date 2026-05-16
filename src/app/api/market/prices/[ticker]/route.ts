import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { assetPrices } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticker } = await params
  const body = await req.json()
  const { price, currency, name } = body

  if (typeof price !== 'number' || isNaN(price) || price < 0) {
    return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 })
  }

  const [row] = await db
    .insert(assetPrices)
    .values({
      ticker: ticker.toUpperCase(),
      assetType: 'stock',
      name: name ?? ticker.toUpperCase(),
      price: String(price),
      currency: currency ?? 'IDR',
    })
    .onConflictDoUpdate({
      target: assetPrices.ticker,
      set: {
        price: String(price),
        ...(currency ? { currency } : {}),
        ...(name ? { name } : {}),
        updatedAt: sql`now()`,
      },
    })
    .returning()

  return NextResponse.json(row)
}
