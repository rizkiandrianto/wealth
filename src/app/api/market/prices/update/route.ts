import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { stockHoldings, cryptoHoldings, goldHoldings, assetPrices } from '@/db/schema'
import { sql } from 'drizzle-orm'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

async function getUniqueTickers() {
  const [stockRows, cryptoRows] = await Promise.all([
    db.selectDistinct({ ticker: stockHoldings.ticker }).from(stockHoldings),
    db
      .selectDistinct({ symbol: cryptoHoldings.symbol, name: cryptoHoldings.name })
      .from(cryptoHoldings),
  ])

  let hasGold = false
  try {
    const goldRows = await db.select({ id: goldHoldings.id }).from(goldHoldings).limit(1)
    hasGold = goldRows.length > 0
  } catch {
    // table doesn't exist yet
  }

  return {
    stocks: stockRows.map((r) => r.ticker),
    cryptos: cryptoRows,
    hasGold,
  }
}

async function fetchCryptoPrices(
  symbols: { symbol: string; name: string }[],
): Promise<{ ticker: string; price: number; name: string; failed: string[] }> {
  const failed: string[] = []
  const results: { ticker: string; price: number; name: string }[] = []

  // Resolve symbol → CoinGecko ID via search
  const idMap = new Map<string, { id: string; name: string }>()
  await Promise.all(
    symbols.map(async ({ symbol, name }) => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
          { signal: AbortSignal.timeout(8000) },
        )
        if (!res.ok) throw new Error('CoinGecko search failed')
        const data = await res.json()
        const exact = data.coins?.find(
          (c: { symbol: string; id: string; name: string }) =>
            c.symbol.toLowerCase() === symbol.toLowerCase(),
        )
        if (exact) {
          idMap.set(symbol, { id: exact.id, name: exact.name })
        } else {
          failed.push(symbol)
        }
      } catch {
        failed.push(symbol)
      }
    }),
  )

  if (idMap.size === 0) return { ticker: '', price: 0, name: '', failed } as never

  const ids = Array.from(idMap.values())
    .map((v) => v.id)
    .join(',')
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) throw new Error('CoinGecko price fetch failed')
    const priceData: Record<string, { usd: number }> = await res.json()

    for (const [symbol, { id, name: cgName }] of idMap.entries()) {
      const price = priceData[id]?.usd
      if (price !== undefined) {
        results.push({ ticker: symbol, price, name: cgName })
      } else {
        failed.push(symbol)
      }
    }
  } catch {
    for (const symbol of idMap.keys()) failed.push(symbol)
  }

  return { ...results, failed } as never
}

async function fetchStockPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}.JK`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : null
  } catch {
    return null
  }
}

async function fetchGoldPriceIDR(): Promise<number | null> {
  const goldApiKey = process.env.GOLD_API_KEY
  if (goldApiKey) {
    try {
      const res = await fetch('https://www.goldapi.io/api/XAU/IDR', {
        headers: { 'x-access-token': goldApiKey },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json()
        // goldapi returns price per troy oz; convert to per gram (1 troy oz = 31.1035 g)
        const pricePerOz: number = data.price
        if (typeof pricePerOz === 'number') return pricePerOz / 31.1035
      }
    } catch {
      // fall through to free fallback
    }
  }

  // Fallback: XAU/USD × USD/IDR
  try {
    const [xauRes, fxRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd', {
        signal: AbortSignal.timeout(8000),
      }),
      fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(8000) }),
    ])
    if (!xauRes.ok || !fxRes.ok) return null
    const xauData = await xauRes.json()
    const fxData = await fxRes.json()
    const xauUsd: number = xauData?.['tether-gold']?.usd
    const usdIdr: number = fxData?.rates?.IDR
    if (typeof xauUsd === 'number' && typeof usdIdr === 'number') {
      // tether-gold is ~1 troy oz; convert to per gram
      return (xauUsd * usdIdr) / 31.1035
    }
  } catch {
    // all fallbacks failed
  }

  return null
}

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stocks, cryptos, hasGold } = await getUniqueTickers()

  const updated = { stock: 0, crypto: 0, gold: 0 }
  const failed = { stock: [] as string[], crypto: [] as string[], gold: [] as string[] }

  // --- Stocks ---
  await Promise.all(
    stocks.map(async (ticker) => {
      const price = await fetchStockPrice(ticker)
      if (price === null) {
        console.warn(`[price-update] stock ${ticker} failed`)
        failed.stock.push(ticker)
        return
      }
      await db
        .insert(assetPrices)
        .values({ ticker, assetType: 'stock', name: ticker, price: String(price), currency: 'IDR' })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: { price: String(price), updatedAt: sql`now()` },
        })
      updated.stock++
    }),
  )

  // --- Crypto ---
  const cryptoResults: { ticker: string; price: number; name: string }[] = []
  const cryptoFailed: string[] = []

  // Resolve IDs
  const idMap = new Map<string, { id: string; name: string }>()
  await Promise.all(
    cryptos.map(async ({ symbol, name }) => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
          { signal: AbortSignal.timeout(8000) },
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        const exact = data.coins?.find(
          (c: { symbol: string; id: string; name: string }) =>
            c.symbol.toLowerCase() === symbol.toLowerCase(),
        )
        if (exact) idMap.set(symbol, { id: exact.id, name: exact.name || name })
        else cryptoFailed.push(symbol)
      } catch {
        cryptoFailed.push(symbol)
      }
    }),
  )

  if (idMap.size > 0) {
    const ids = Array.from(idMap.values())
      .map((v) => v.id)
      .join(',')
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
        { signal: AbortSignal.timeout(10000) },
      )
      if (!res.ok) throw new Error()
      const priceData: Record<string, { usd: number }> = await res.json()

      for (const [symbol, { id, name }] of idMap.entries()) {
        const price = priceData[id]?.usd
        if (price !== undefined) cryptoResults.push({ ticker: symbol, price, name })
        else cryptoFailed.push(symbol)
      }
    } catch {
      for (const symbol of idMap.keys()) cryptoFailed.push(symbol)
    }
  }

  await Promise.all(
    cryptoResults.map(async ({ ticker, price, name }) => {
      await db
        .insert(assetPrices)
        .values({ ticker, assetType: 'crypto', name, price: String(price), currency: 'USD' })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: { price: String(price), name, updatedAt: sql`now()` },
        })
      updated.crypto++
    }),
  )
  failed.crypto = cryptoFailed

  // --- Gold ---
  if (hasGold) {
    const goldPrice = await fetchGoldPriceIDR()
    if (goldPrice === null) {
      console.warn('[price-update] gold XAU fetch failed')
      failed.gold.push('XAU')
    } else {
      await db
        .insert(assetPrices)
        .values({
          ticker: 'XAU',
          assetType: 'gold',
          name: 'Gold',
          price: String(goldPrice),
          currency: 'IDR',
        })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: { price: String(goldPrice), updatedAt: sql`now()` },
        })
      updated.gold++
    }
  }

  return NextResponse.json({ updated, failed, updatedAt: new Date().toISOString() })
}
