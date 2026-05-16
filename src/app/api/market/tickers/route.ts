import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { stockHoldings, cryptoHoldings, goldHoldings } from '@/db/schema'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

export async function GET(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [stockRows, cryptoRows] = await Promise.all([
    db.selectDistinct({ ticker: stockHoldings.ticker }).from(stockHoldings),
    db.selectDistinct({ symbol: cryptoHoldings.symbol }).from(cryptoHoldings),
  ])

  // Check if gold_holdings table has any rows (Phase 11 may or may not exist)
  let hasGold = false
  try {
    const goldRows = await db.select({ id: goldHoldings.id }).from(goldHoldings).limit(1)
    hasGold = goldRows.length > 0
  } catch {
    // gold_holdings table doesn't exist yet
  }

  return NextResponse.json({
    stock: stockRows.map((r) => r.ticker),
    crypto: cryptoRows.map((r) => r.symbol),
    gold: hasGold ? ['XAU'] : [],
  })
}
