interface CMCQuote {
  IDR?: { price?: number }
}

interface CMCEntry {
  symbol?: string
  quote?: CMCQuote
}

interface CMCResponse {
  data?: Record<string, CMCEntry | CMCEntry[] | undefined>
}

let warnedMissingKey = false

/**
 * Fetch IDR prices from CoinMarketCap for the given crypto symbols.
 * Returns a map keyed by uppercase symbol. Missing entries mean CMC
 * had no price (or the request failed); the caller decides how to react.
 *
 * Requires `COINMARKETCAP_API_KEY`. If unset, returns an empty map and
 * logs a one-time warning so we don't spam logs every request.
 */
export async function fetchCryptoPricesFromCMC(
  symbols: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()

  const unique = Array.from(
    new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
  )
  if (unique.length === 0) return out

  const apiKey = process.env.COINMARKETCAP_API_KEY
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn('[cmc] COINMARKETCAP_API_KEY not set; skipping fallback')
      warnedMissingKey = true
    }
    return out
  }

  try {
    const res = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(
        unique.join(','),
      )}&convert=IDR`,
      {
        headers: {
          Accept: 'application/json',
          'X-CMC_PRO_API_KEY': apiKey,
        },
        signal: AbortSignal.timeout(10000),
      },
    )
    if (!res.ok) return out
    const data: CMCResponse = await res.json()
    const entries = data?.data
    if (!entries) return out

    for (const sym of unique) {
      const raw = entries[sym]
      const entry = Array.isArray(raw) ? raw[0] : raw
      const price = entry?.quote?.IDR?.price
      if (typeof price === 'number' && Number.isFinite(price)) {
        out.set(sym, price)
      }
    }
  } catch {
    // swallow — caller treats missing entries as failures
  }

  return out
}
