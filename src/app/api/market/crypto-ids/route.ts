import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { cryptoHoldings } from '@/db/schema'
import { resolveCryptoIds, type CryptoSymbolInput } from '@/lib/market/coingecko'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

async function getHoldingSymbols(): Promise<CryptoSymbolInput[]> {
  const rows = await db
    .selectDistinct({ symbol: cryptoHoldings.symbol, name: cryptoHoldings.name })
    .from(cryptoHoldings)
  return rows.map((r) => ({ symbol: r.symbol, name: r.name }))
}

/**
 * POST /api/market/crypto-ids
 *
 * Resolve CoinGecko IDs for crypto symbols and persist them onto
 * `asset_prices.external_id`. Used by the price-update job before fetching
 * prices, but exposed as an endpoint so it can be triggered independently
 * (e.g. after seeding new holdings).
 *
 * Body (optional):
 *   { symbols?: ({ symbol: string; name?: string } | string)[], force?: boolean }
 *
 * If `symbols` is omitted, it resolves IDs for every distinct symbol in
 * `crypto_holdings`. If `force` is true, IDs are re-resolved even if already
 * stored.
 */
export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { symbols?: (string | CryptoSymbolInput)[]; force?: boolean } = {}
  try {
    if (req.headers.get('content-length') !== '0') body = await req.json()
  } catch {
    // ignore — empty / non-JSON body is allowed
  }

  let symbols: CryptoSymbolInput[]
  if (Array.isArray(body.symbols) && body.symbols.length > 0) {
    symbols = body.symbols.map((s) =>
      typeof s === 'string' ? { symbol: s } : { symbol: s.symbol, name: s.name },
    )
  } else {
    symbols = await getHoldingSymbols()
  }

  const result = await resolveCryptoIds(symbols, { force: body.force === true })

  return NextResponse.json({
    ...result,
    requested: symbols.length,
  })
}
