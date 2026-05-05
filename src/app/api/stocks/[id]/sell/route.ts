import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { stockHoldings, stockSales } from '@/db/schema'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: stockId } = await params
  const { quantity, salePrice } = await req.json()

  if (!quantity || !salePrice || quantity <= 0 || salePrice <= 0) {
    return NextResponse.json({ error: 'Invalid quantity or price' }, { status: 400 })
  }

  const [holding] = await db
    .select()
    .from(stockHoldings)
    .where(and(eq(stockHoldings.id, stockId), eq(stockHoldings.userId, userId)))
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
        .delete(stockHoldings)
        .where(and(eq(stockHoldings.id, stockId), eq(stockHoldings.userId, userId)))
    } else {
      await tx
        .update(stockHoldings)
        .set({ quantity: String(currentQty - quantity) })
        .where(and(eq(stockHoldings.id, stockId), eq(stockHoldings.userId, userId)))
    }

    const [sale] = await tx
      .insert(stockSales)
      .values({
        userId,
        stockId,
        ticker: holding.ticker,
        quantity: String(quantity),
        salePrice: String(salePrice),
        averageCostPrice: String(avgPrice),
        realizedPnl: String(realizedPnl),
        realizedPnlPercent: String(realizedPnlPercent),
        saleDate: new Date(),
      })
      .returning()

    return sale
  })

  return NextResponse.json(result, { status: 201 })
}
