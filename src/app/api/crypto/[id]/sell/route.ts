import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { cryptoHoldings, cryptoSales } from '@/db/schema'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: cryptoId } = await params
  const { quantity, salePrice, saleDate } = await req.json()

  if (!quantity || !salePrice || quantity <= 0 || salePrice <= 0) {
    return NextResponse.json({ error: 'Invalid quantity or price' }, { status: 400 })
  }

  const saleTimestamp = saleDate ? new Date(saleDate) : new Date()

  const [holding] = await db
    .select()
    .from(cryptoHoldings)
    .where(and(eq(cryptoHoldings.id, cryptoId), eq(cryptoHoldings.userId, userId)))
    .limit(1)

  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentQty = parseFloat(holding.quantity)
  const avgPrice = parseFloat(holding.averagePrice)

  if (quantity > currentQty) {
    return NextResponse.json({ error: 'Insufficient quantity' }, { status: 400 })
  }

  const realizedPnl = quantity * salePrice - quantity * avgPrice
  const realizedPnlPercent = avgPrice > 0 ? (realizedPnl / (quantity * avgPrice)) * 100 : 0

  const result = await db.transaction(async (tx) => {
    if (quantity === currentQty) {
      await tx
        .delete(cryptoHoldings)
        .where(and(eq(cryptoHoldings.id, cryptoId), eq(cryptoHoldings.userId, userId)))
    } else {
      await tx
        .update(cryptoHoldings)
        .set({ quantity: String(currentQty - quantity) })
        .where(and(eq(cryptoHoldings.id, cryptoId), eq(cryptoHoldings.userId, userId)))
    }

    const [sale] = await tx
      .insert(cryptoSales)
      .values({
        userId,
        cryptoId,
        symbol: holding.symbol,
        quantity: String(quantity),
        salePrice: String(salePrice),
        averageCostPrice: String(avgPrice),
        realizedPnl: String(realizedPnl),
        realizedPnlPercent: String(realizedPnlPercent),
        saleDate: saleTimestamp,
      })
      .returning()

    return sale
  })

  return NextResponse.json(result, { status: 201 })
}
