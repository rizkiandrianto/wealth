import { NextRequest, NextResponse } from 'next/server'

interface CoinGeckoResult {
  id: string
  name: string
  symbol: string
}

interface CoinGeckoSearchResponse {
  coins: CoinGeckoResult[]
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')?.trim().toLowerCase()

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
      { next: { revalidate: 3600 } },
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko request failed' }, { status: 502 })
    }

    const data: CoinGeckoSearchResponse = await res.json()

    const exact = data.coins.find((c) => c.symbol.toLowerCase() === symbol)
    if (!exact) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    return NextResponse.json({ name: exact.name, id: exact.id })
  } catch {
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
