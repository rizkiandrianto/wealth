import {
  fetchCryptoPricesByIds,
  resolveCryptoIds,
  type CryptoSymbolInput,
} from './coingecko'
import { fetchCryptoPricesFromCMC } from './coinmarketcap'

export type CryptoPriceSource = 'coingecko' | 'coinmarketcap'

export type CryptoPriceEntry = {
  symbol: string
  name: string
  price: number
  externalId: string | null
  source: CryptoPriceSource
}

export type CryptoPriceResult = {
  entries: CryptoPriceEntry[]
  failed: string[]
}

/**
 * Fetch IDR prices for crypto symbols, using CoinGecko as the primary
 * source and CoinMarketCap as a fallback for any symbol that CoinGecko
 * couldn't resolve or didn't return a price for.
 */
export async function fetchCryptoPricesIDR(
  inputs: CryptoSymbolInput[],
): Promise<CryptoPriceResult> {
  const entries: CryptoPriceEntry[] = []
  const failed: string[] = []

  const nameByInput = new Map<string, string | undefined>()
  for (const s of inputs) {
    const sym = s.symbol?.trim().toUpperCase()
    if (sym && !nameByInput.has(sym)) nameByInput.set(sym, s.name)
  }

  const idResult = await resolveCryptoIds(inputs)

  const cgPriceMap =
    idResult.resolved.length > 0
      ? await fetchCryptoPricesByIds(idResult.resolved.map((r) => r.externalId))
      : new Map<string, number>()

  type CmcCandidate = { symbol: string; name: string; externalId: string | null }
  const cmcCandidates: CmcCandidate[] = []

  for (const r of idResult.resolved) {
    const price = cgPriceMap.get(r.externalId)
    if (typeof price === 'number') {
      entries.push({
        symbol: r.symbol,
        name: r.name,
        price,
        externalId: r.externalId,
        source: 'coingecko',
      })
    } else {
      cmcCandidates.push({
        symbol: r.symbol,
        name: r.name,
        externalId: r.externalId,
      })
    }
  }

  for (const sym of idResult.failed) {
    const ticker = sym.toUpperCase()
    cmcCandidates.push({
      symbol: ticker,
      name: nameByInput.get(ticker) ?? ticker,
      externalId: null,
    })
  }

  if (cmcCandidates.length > 0) {
    const cmcMap = await fetchCryptoPricesFromCMC(cmcCandidates.map((c) => c.symbol))
    for (const c of cmcCandidates) {
      const price = cmcMap.get(c.symbol)
      if (typeof price === 'number') {
        entries.push({ ...c, price, source: 'coinmarketcap' })
      } else {
        failed.push(c.symbol)
      }
    }
  }

  return { entries, failed }
}
