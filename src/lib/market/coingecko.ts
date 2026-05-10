import { db } from '@/db'
import { assetPrices } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export type CryptoSymbolInput = { symbol: string; name?: string }

export type ResolvedCryptoId = {
  symbol: string
  externalId: string
  name: string
}

export type ResolveCryptoIdsResult = {
  resolved: ResolvedCryptoId[]
  failed: string[]
  cached: string[]
}

interface CoinGeckoSearchCoin {
  id: string
  name: string
  symbol: string
}

interface CoinGeckoSearchResponse {
  coins?: CoinGeckoSearchCoin[]
}

async function searchCoinGecko(symbol: string): Promise<CoinGeckoSearchCoin | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data: CoinGeckoSearchResponse = await res.json()
    return (
      data.coins?.find((c) => c.symbol.toLowerCase() === symbol.toLowerCase()) ?? null
    )
  } catch {
    return null
  }
}

/**
 * Resolve CoinGecko IDs for the given crypto symbols and persist them on
 * `asset_prices.external_id`. Symbols that already have a stored `externalId`
 * are skipped unless `force` is true.
 */
export async function resolveCryptoIds(
  symbols: CryptoSymbolInput[],
  options: { force?: boolean } = {},
): Promise<ResolveCryptoIdsResult> {
  const result: ResolveCryptoIdsResult = { resolved: [], failed: [], cached: [] }

  const unique = new Map<string, CryptoSymbolInput>()
  for (const s of symbols) {
    const key = s.symbol.trim().toUpperCase()
    if (!key) continue
    if (!unique.has(key)) unique.set(key, { symbol: key, name: s.name })
  }
  if (unique.size === 0) return result

  // Pull existing rows so we can skip already-resolved tickers
  const existing = await db
    .select({
      ticker: assetPrices.ticker,
      externalId: assetPrices.externalId,
      name: assetPrices.name,
    })
    .from(assetPrices)
    .where(inArray(assetPrices.ticker, Array.from(unique.keys())))

  const existingMap = new Map(existing.map((r) => [r.ticker, r]))

  const toLookup: CryptoSymbolInput[] = []
  for (const [ticker, input] of unique.entries()) {
    const row = existingMap.get(ticker)
    if (!options.force && row?.externalId) {
      result.cached.push(ticker)
      result.resolved.push({
        symbol: ticker,
        externalId: row.externalId,
        name: row.name,
      })
      continue
    }
    toLookup.push(input)
  }

  // Lookup CoinGecko in parallel for the missing ones
  await Promise.all(
    toLookup.map(async (input) => {
      const coin = await searchCoinGecko(input.symbol)
      if (!coin) {
        result.failed.push(input.symbol)
        return
      }

      const name = coin.name || input.name || input.symbol
      await db
        .insert(assetPrices)
        .values({
          ticker: input.symbol,
          assetType: 'crypto',
          name,
          externalId: coin.id,
          currency: 'USD',
        })
        .onConflictDoUpdate({
          target: assetPrices.ticker,
          set: { externalId: coin.id, name },
        })

      result.resolved.push({ symbol: input.symbol, externalId: coin.id, name })
    }),
  )

  return result
}

interface CoinGeckoPriceResponse {
  [id: string]: { usd?: number, idr?: number }
}

/**
 * Fetch USD prices for the given CoinGecko IDs in a single batch call.
 * Returns a map keyed by CoinGecko id.
 */
export async function fetchCryptoPricesByIds(
  ids: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        unique.join(','),
      )}&vs_currencies=idr`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) return out
    const data: CoinGeckoPriceResponse = await res.json()
    for (const id of unique) {
      const price = data[id]?.idr
      if (typeof price === 'number') out.set(id, price)
    }
  } catch {
    // swallow — caller treats missing entries as failures
  }

  return out
}

/**
 * Convenience: clear a stored externalId so the next resolve call refetches it.
 */
export async function clearCryptoExternalId(ticker: string): Promise<void> {
  await db
    .update(assetPrices)
    .set({ externalId: null })
    .where(eq(assetPrices.ticker, ticker.toUpperCase()))
}
