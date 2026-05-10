import { db } from '@/db'
import { assetPrices } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const FX_TICKER = 'USDIDR'
const FX_API = 'https://open.er-api.com/v6/latest/USD'

export async function fetchUsdIdrFromApi(): Promise<number | null> {
  try {
    const res = await fetch(FX_API, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const idr = data?.rates?.IDR
    return typeof idr === 'number' ? idr : null
  } catch {
    return null
  }
}

export async function getCachedUsdIdr(): Promise<number | null> {
  const [row] = await db
    .select({ price: assetPrices.price })
    .from(assetPrices)
    .where(eq(assetPrices.ticker, FX_TICKER))
  return row ? Number(row.price) : null
}

export async function refreshUsdIdr(): Promise<number | null> {
  const rate = await fetchUsdIdrFromApi()
  if (rate === null) return null
  await db
    .insert(assetPrices)
    .values({
      ticker: FX_TICKER,
      assetType: 'fx',
      name: 'USD/IDR',
      price: String(rate),
      currency: 'IDR',
    })
    .onConflictDoUpdate({
      target: assetPrices.ticker,
      set: { price: String(rate), updatedAt: sql`now()` },
    })
  return rate
}
