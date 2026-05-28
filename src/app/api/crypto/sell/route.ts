import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, asc, eq } from 'drizzle-orm'
import { cryptoHoldings, cryptoSales } from '@/db/schema'

type SellBody = {
  symbol?: string
  locationId?: string
  quantity?: number
  salePrice?: number
  saleDate?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol, locationId, quantity, salePrice, saleDate }: SellBody = await req.json()

  if (!symbol || !locationId || !quantity || !salePrice || quantity <= 0 || salePrice <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const lots = await db
    .select()
    .from(cryptoHoldings)
    .where(
      and(
        eq(cryptoHoldings.userId, userId),
        eq(cryptoHoldings.symbol, symbol),
        eq(cryptoHoldings.locationId, locationId)
      )
    )
    .orderBy(asc(cryptoHoldings.purchaseDate), asc(cryptoHoldings.createdAt))

  if (lots.length === 0) {
    return NextResponse.json({ error: 'No holdings for this symbol/location' }, { status: 404 })
  }

  const totalAvailable = lots.reduce((sum, l) => sum + parseFloat(l.quantity), 0)
  if (quantity > totalAvailable + 1e-12) {
    return NextResponse.json({ error: 'Insufficient quantity' }, { status: 400 })
  }

  const saleTimestamp = saleDate ? new Date(saleDate) : new Date()

  const result = await db.transaction(async (tx) => {
    let remaining = quantity
    const sales = []

    for (const lot of lots) {
      if (remaining <= 1e-12) break

      const lotQty = parseFloat(lot.quantity)
      const lotAvg = parseFloat(lot.averagePrice)
      const consume = Math.min(remaining, lotQty)

      const realizedPnl = consume * salePrice - consume * lotAvg
      const realizedPnlPercent = lotAvg > 0 ? (realizedPnl / (consume * lotAvg)) * 100 : 0

      if (Math.abs(consume - lotQty) < 1e-12) {
        await tx
          .delete(cryptoHoldings)
          .where(and(eq(cryptoHoldings.id, lot.id), eq(cryptoHoldings.userId, userId)))
      } else {
        await tx
          .update(cryptoHoldings)
          .set({ quantity: String(lotQty - consume) })
          .where(and(eq(cryptoHoldings.id, lot.id), eq(cryptoHoldings.userId, userId)))
      }

      const [sale] = await tx
        .insert(cryptoSales)
        .values({
          userId,
          cryptoId: lot.id,
          symbol: lot.symbol,
          quantity: String(consume),
          salePrice: String(salePrice),
          averageCostPrice: String(lotAvg),
          realizedPnl: String(realizedPnl),
          realizedPnlPercent: String(realizedPnlPercent),
          saleDate: saleTimestamp,
          purchaseDate: lot.purchaseDate,
        })
        .returning()

      sales.push({ sale, holdingId: lot.id, holdingFullyConsumed: Math.abs(consume - lotQty) < 1e-12, remainingQty: lotQty - consume })
      remaining -= consume
    }

    return sales
  })

  return NextResponse.json(result, { status: 201 })
}
