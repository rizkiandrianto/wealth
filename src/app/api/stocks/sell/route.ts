import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, asc, eq } from 'drizzle-orm'
import { stockHoldings, stockSales } from '@/db/schema'
import { sharesFor } from '@/lib/stock'
import type { StockMarket } from '@/lib/types'

type SellBody = {
  ticker?: string
  locationId?: string
  quantity?: number
  salePrice?: number
  saleDate?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, locationId, quantity, salePrice, saleDate }: SellBody = await req.json()

  if (!ticker || !locationId || !quantity || !salePrice || quantity <= 0 || salePrice <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const lots = await db
    .select()
    .from(stockHoldings)
    .where(
      and(
        eq(stockHoldings.userId, userId),
        eq(stockHoldings.ticker, ticker),
        eq(stockHoldings.locationId, locationId)
      )
    )
    .orderBy(asc(stockHoldings.purchaseDate), asc(stockHoldings.createdAt))

  if (lots.length === 0) {
    return NextResponse.json({ error: 'No holdings for this ticker/location' }, { status: 404 })
  }

  const totalAvailable = lots.reduce((sum, l) => sum + parseFloat(l.quantity), 0)
  if (quantity > totalAvailable + 1e-9) {
    return NextResponse.json({ error: 'Insufficient quantity' }, { status: 400 })
  }

  const saleTimestamp = saleDate ? new Date(saleDate) : new Date()

  const result = await db.transaction(async (tx) => {
    let remaining = quantity
    const sales = []

    for (const lot of lots) {
      if (remaining <= 1e-9) break

      const lotQty = parseFloat(lot.quantity)
      const lotAvg = parseFloat(lot.averagePrice)
      const consume = Math.min(remaining, lotQty)

      const shares = sharesFor(lot.market as StockMarket, consume)
      const realizedPnl = shares * salePrice - shares * lotAvg
      const realizedPnlPercent = lotAvg > 0 ? (realizedPnl / (shares * lotAvg)) * 100 : 0

      if (Math.abs(consume - lotQty) < 1e-9) {
        await tx
          .delete(stockHoldings)
          .where(and(eq(stockHoldings.id, lot.id), eq(stockHoldings.userId, userId)))
      } else {
        await tx
          .update(stockHoldings)
          .set({ quantity: String(lotQty - consume) })
          .where(and(eq(stockHoldings.id, lot.id), eq(stockHoldings.userId, userId)))
      }

      const [sale] = await tx
        .insert(stockSales)
        .values({
          userId,
          stockId: lot.id,
          ticker: lot.ticker,
          quantity: String(consume),
          salePrice: String(salePrice),
          averageCostPrice: String(lotAvg),
          realizedPnl: String(realizedPnl),
          realizedPnlPercent: String(realizedPnlPercent),
          saleDate: saleTimestamp,
        })
        .returning()

      sales.push({ sale, holdingId: lot.id, holdingFullyConsumed: Math.abs(consume - lotQty) < 1e-9, remainingQty: lotQty - consume })
      remaining -= consume
    }

    return sales
  })

  return NextResponse.json(result, { status: 201 })
}
