import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { stockHoldings, cryptoHoldings, goldHoldings, assetPrices } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { fetchCryptoPricesIDR } from '@/lib/market/cryptoPrice'
import { getCachedUsdIdr, refreshUsdIdr } from '@/lib/market/fx'

type StockMarket = 'IDX' | 'US'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

async function getUniqueTickers() {
  const [stockRows, cryptoRows] = await Promise.all([
    db
      .selectDistinct({ ticker: stockHoldings.ticker, market: stockHoldings.market })
      .from(stockHoldings),
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
    stocks: stockRows.map((r) => ({
      ticker: r.ticker,
      market: (r.market === 'US' ? 'US' : 'IDX') as StockMarket,
    })),
    cryptos: cryptoRows,
    hasGold,
  }
}

async function fetchStockPrice(
  ticker: string,
  market: StockMarket,
): Promise<{ price: number; currency: 'IDR' | 'USD' } | null> {
  const symbol = market === 'IDX' ? `${ticker}.JK` : ticker
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof price !== 'number') return null
    return { price, currency: market === 'IDX' ? 'IDR' : 'USD' }
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
  const hasUsStock = stocks.some((s) => s.market === 'US')
  let usdIdr: number | null = null
  if (hasUsStock) {
    usdIdr = (await getCachedUsdIdr()) ?? (await refreshUsdIdr())
    if (usdIdr === null) {
      console.warn('[price-update] USD/IDR rate unavailable; US stocks will fail')
    }
  }

  await Promise.all(
    stocks.map(async ({ ticker, market }) => {
      const result = await fetchStockPrice(ticker, market)
      if (!result) {
        console.warn(`[price-update] stock ${ticker} (${market}) failed`)
        failed.stock.push(ticker)
        return
      }
      let priceIdr = result.price
      if (result.currency === 'USD') {
        if (usdIdr === null) {
          failed.stock.push(ticker)
          return
        }
        priceIdr = result.price * usdIdr
      }
      await db
        .insert(assetPrices)
        .values({
          ticker,
          assetType: 'stock',
          name: ticker,
          price: String(priceIdr),
          currency: 'IDR',
        })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: { price: String(priceIdr), updatedAt: sql`now()` },
        })
      updated.stock++
    }),
  )

  // --- Crypto ---
  // CoinGecko primary; CoinMarketCap fallback for symbols CG can't resolve/price.
  const cryptoResult = await fetchCryptoPricesIDR(cryptos)
  failed.crypto.push(...cryptoResult.failed)

  await Promise.all(
    cryptoResult.entries.map(async ({ symbol, name, price, externalId }) => {
      await db
        .insert(assetPrices)
        .values({
          ticker: symbol,
          assetType: 'crypto',
          name,
          externalId,
          price: String(price),
          currency: 'IDR',
        })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: {
            price: String(price),
            name,
            // Don't clobber a previously-cached CG id with null when only CMC succeeded
            ...(externalId ? { externalId } : {}),
            updatedAt: sql`now()`,
          },
        })
      updated.crypto++
    }),
  )

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
