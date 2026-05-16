import { NextResponse } from 'next/server'
import { db } from '@/db'
import { assetPrices } from '@/db/schema'

export async function GET() {
  const rows = await db.select().from(assetPrices)
  return NextResponse.json(rows)
}
