import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { goldHoldings, goldSales } from '@/db/schema'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: goldId } = await params
  const { weight, salePrice } = await req.json()

  if (!weight || !salePrice || weight <= 0 || salePrice <= 0) {
    return NextResponse.json({ error: 'Invalid weight or price' }, { status: 400 })
  }

  const [holding] = await db
    .select()
    .from(goldHoldings)
    .where(and(eq(goldHoldings.id, goldId), eq(goldHoldings.userId, userId)))
    .limit(1)

  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentWeight = parseFloat(holding.weight)
  const avgPrice = parseFloat(holding.purchasePrice)

  if (weight > currentWeight) {
    return NextResponse.json({ error: 'Insufficient weight' }, { status: 400 })
  }

  const realizedPnl = weight * salePrice - weight * avgPrice
  const realizedPnlPercent = avgPrice > 0 ? (realizedPnl / (weight * avgPrice)) * 100 : 0

  const result = await db.transaction(async (tx) => {
    if (weight === currentWeight) {
      await tx
        .delete(goldHoldings)
        .where(and(eq(goldHoldings.id, goldId), eq(goldHoldings.userId, userId)))
    } else {
      await tx
        .update(goldHoldings)
        .set({ weight: String(currentWeight - weight) })
        .where(and(eq(goldHoldings.id, goldId), eq(goldHoldings.userId, userId)))
    }

    const [sale] = await tx
      .insert(goldSales)
      .values({
        userId,
        goldId,
        weight: String(weight),
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
