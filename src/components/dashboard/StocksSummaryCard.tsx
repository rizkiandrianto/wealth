'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { useStocksQuery } from '@/lib/queries/stocks'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

export default function StocksSummaryCard() {
  const formatCurrency = useFormatCurrency()
  const { data: stocks = [], isLoading: stocksLoading } = useStocksQuery()
  const { data: prices = [], isLoading: pricesLoading } = useAssetPricesQuery()

  if (stocksLoading || pricesLoading) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  if (stocks.length === 0) return null

  const getPrice = (ticker: string) => prices.find((p) => p.ticker === ticker)?.price ?? 0
  const totalValue = stocks.reduce((s, st) => s + stockShares(st) * getPrice(st.ticker), 0)
  const totalCost = stocks.reduce((s, st) => s + stockShares(st) * st.averagePrice, 0)
  const profit = totalValue - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0
  const isPositive = profit >= 0

  return (
    <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Saham</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {new Set(stocks.map((s) => s.ticker)).size} saham dimiliki
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            <p
              className={`text-sm font-medium flex items-center gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
        <Link href="/stocks">
          <Button variant="outline" className="gap-2">
            Detail
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
