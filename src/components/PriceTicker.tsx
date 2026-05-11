'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useAssetStore } from '@/lib/useAssetStore'
import { formatCurrency, useFormatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'

type TickerItem = {
  key: string
  href: string
  label: string
  badge?: string
  price: number
  changePct: number | null
  currency?: string
}

function formatPrice(value: number, currency: string, format: (v: number, c?: string) => string) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 1 ? 2 : 6,
    }).format(value)
  }
  return format(value, currency)
}

export default function PriceTicker() {
  const { stocks, cryptos, golds, assetPrices } = useAssetStore()

  const items: TickerItem[] = useMemo(() => {
    const result: TickerItem[] = []

    // Stocks — aggregate by ticker
    const stockByTicker = new Map<
      string,
      { ticker: string; totalShares: number; totalCost: number; market: 'IDX' | 'US' }
    >()
    for (const s of stocks) {
      const shares = stockShares(s)
      const existing = stockByTicker.get(s.ticker)
      if (existing) {
        existing.totalShares += shares
        existing.totalCost += shares * s.averagePrice
      } else {
        stockByTicker.set(s.ticker, {
          ticker: s.ticker,
          totalShares: shares,
          totalCost: shares * s.averagePrice,
          market: s.market,
        })
      }
    }
    for (const { ticker, totalShares, totalCost, market } of stockByTicker.values()) {
      const priceRow = assetPrices.find((p) => p.ticker === ticker)
      const price = priceRow?.price ?? 0
      if (!price) continue
      const avgCost = totalShares > 0 ? totalCost / totalShares : 0
      const changePct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : null
      result.push({
        key: `stock-${ticker}`,
        href: '/stocks',
        label: ticker,
        badge: market,
        price,
        changePct,
        currency: priceRow?.currency,
      })
    }

    // Cryptos — aggregate by symbol
    const cryptoBySymbol = new Map<
      string,
      { symbol: string; totalQty: number; totalCost: number }
    >()
    for (const c of cryptos) {
      const existing = cryptoBySymbol.get(c.symbol)
      if (existing) {
        existing.totalQty += c.quantity
        existing.totalCost += c.quantity * c.averagePrice
      } else {
        cryptoBySymbol.set(c.symbol, {
          symbol: c.symbol,
          totalQty: c.quantity,
          totalCost: c.quantity * c.averagePrice,
        })
      }
    }
    for (const { symbol, totalQty, totalCost } of cryptoBySymbol.values()) {
      const priceRow = assetPrices.find((p) => p.ticker === symbol)
      const price = priceRow?.price ?? 0
      if (!price) continue
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0
      const changePct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : null
      result.push({
        key: `crypto-${symbol}`,
        href: '/crypto',
        label: symbol,
        badge: 'CRYPTO',
        price,
        changePct,
        currency: priceRow?.currency,
      })
    }

    // Gold
    if (golds.length > 0) {
      const priceRow = assetPrices.find((p) => p.ticker === 'XAU')
      const price = priceRow?.price ?? 0
      if (price) {
        const totalWeight = golds.reduce((sum, g) => sum + g.weight, 0)
        const totalCost = golds.reduce((sum, g) => sum + g.weight * g.purchasePrice, 0)
        const avgCost = totalWeight > 0 ? totalCost / totalWeight : 0
        const changePct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : null
        result.push({
          key: 'gold-XAU',
          href: '/gold',
          label: 'XAU',
          badge: 'GOLD',
          price,
          changePct,
          currency: priceRow?.currency,
        })
      }
    }

    return result
  }, [stocks, cryptos, golds, assetPrices])

  if (items.length === 0) return null

  // Duplicate items so the marquee can loop seamlessly.
  const loop = [...items, ...items]
  const duration = `${Math.max(20, items.length * 6)}s`

  return (
    <div className="border-b border-border bg-neutral-900 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div
          className="ticker-track flex w-max gap-6 py-2 px-4"
          style={{ ['--ticker-duration' as string]: duration }}
        >
          {loop.map((item, idx) => {
            const pct = item.changePct
            const positive = pct !== null && pct >= 0
            const Trend = pct === null ? Minus : positive ? TrendingUp : TrendingDown
            const color =
              pct === null
                ? 'text-muted-foreground'
                : positive
                  ? 'text-green-600'
                  : 'text-red-600'
            return (
              <Link
                key={`${item.key}-${idx}`}
                href={item.href}
                className="flex items-center gap-2 text-sm whitespace-nowrap hover:text-background transition-colors"
              >
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {item.badge}
                  </span>
                )}
                <span className="font-semibold text-background">{item.label}</span>
                <span className="font-medium text-background">
                  {formatPrice(item.price, item.currency ?? 'IDR', (val, cur) => formatCurrency(val, cur, false))}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
                  <Trend className="w-3 h-3" />
                  {pct !== null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
