import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { goldHoldings } from '@/db/schema'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, string | Date> = {}

  if (body.locationId !== undefined) updates.locationId = body.locationId
  if (body.weight !== undefined) updates.weight = String(body.weight)
  if (body.purchasePrice !== undefined) updates.purchasePrice = String(body.purchasePrice)
  if (body.purchaseDate !== undefined) updates.purchaseDate = new Date(body.purchaseDate)

  const [row] = await db
    .update(goldHoldings)
    .set(updates)
    .where(and(eq(goldHoldings.id, id), eq(goldHoldings.userId, userId)))
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
    .delete(goldHoldings)
    .where(and(eq(goldHoldings.id, id), eq(goldHoldings.userId, userId)))

  return new NextResponse(null, { status: 204 })
}
