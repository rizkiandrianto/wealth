'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useStocksTickersQuery } from '@/lib/queries/stocks'
import { useCryptosTickersQuery } from '@/lib/queries/crypto'
import { useGoldsTickerQuery } from '@/lib/queries/gold'
import { formatCurrency, useFormatCurrency } from '@/lib/format'

type TickerItem = {
  key: string
  href: string
  label: string
  badge?: string
  price: number
  changePercentage: number | null
  currency: string
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
  useFormatCurrency() // initialize hook for SSR locale (kept for parity)
  const { data: stocks = [] } = useStocksTickersQuery()
  const { data: cryptos = [] } = useCryptosTickersQuery()
  const { data: gold } = useGoldsTickerQuery()

  const items: TickerItem[] = useMemo(() => {
    const result: TickerItem[] = []

    for (const s of stocks) {
      if (!s.price) continue
      result.push({
        key: `stock-${s.ticker}`,
        href: '/stocks',
        label: s.ticker,
        badge: s.market,
        price: s.price,
        changePercentage: s.changePercentage,
        currency: s.currency,
      })
    }

    for (const c of cryptos) {
      if (!c.price) continue
      result.push({
        key: `crypto-${c.symbol}`,
        href: '/crypto',
        label: c.symbol,
        badge: 'CRYPTO',
        price: c.price,
        changePercentage: c.changePercentage,
        currency: c.currency,
      })
    }

    if (gold && gold.price) {
      result.push({
        key: 'gold-XAU',
        href: '/gold',
        label: 'XAU',
        badge: 'GOLD',
        price: gold.price,
        changePercentage: gold.changePercentage,
        currency: gold.currency,
      })
    }

    return result
  }, [stocks, cryptos, gold])

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
            const pct = item.changePercentage
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
                  {formatPrice(item.price, item.currency, (val, cur) => formatCurrency(val, cur, false))}
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
