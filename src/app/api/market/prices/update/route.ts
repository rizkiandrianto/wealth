import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { stockHoldings, cryptoHoldings, goldHoldings, assetPrices } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { resolveCryptoIds, fetchCryptoPricesByIds } from '@/lib/market/coingecko'

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
  // Resolve CoinGecko IDs (cached on asset_prices.external_id) before fetching
  const idResult = await resolveCryptoIds(cryptos)
  failed.crypto.push(...idResult.failed)

  if (idResult.resolved.length > 0) {
    const ids = idResult.resolved.map((r) => r.externalId)
    const priceMap = await fetchCryptoPricesByIds(ids)

    await Promise.all(
      idResult.resolved.map(async ({ symbol, externalId, name }) => {
        const price = priceMap.get(externalId)
        if (price === undefined) {
          failed.crypto.push(symbol)
          return
        }
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
              externalId,
              updatedAt: sql`now()`,
            },
          })
        updated.crypto++
      }),
    )
  }

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
