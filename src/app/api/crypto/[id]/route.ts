import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { cryptoHoldings } from '@/db/schema'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.symbol !== undefined) updates.symbol = body.symbol
  if (body.locationId !== undefined) updates.locationId = body.locationId
  if (body.quantity !== undefined) updates.quantity = String(body.quantity)
  if (body.averagePrice !== undefined) updates.averagePrice = String(body.averagePrice)
  if (body.currentPrice !== undefined) updates.currentPrice = String(body.currentPrice)
  if (body.purchaseDate !== undefined) updates.purchaseDate = new Date(body.purchaseDate)

  const [row] = await db
    .update(cryptoHoldings)
    .set(updates)
    .where(and(eq(cryptoHoldings.id, id), eq(cryptoHoldings.userId, userId)))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db
    .delete(cryptoHoldings)
    .where(and(eq(cryptoHoldings.id, id), eq(cryptoHoldings.userId, userId)))

  return new NextResponse(null, { status: 204 })
}
