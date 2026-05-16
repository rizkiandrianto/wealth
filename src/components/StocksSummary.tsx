'use client'

import { useTranslations } from 'next-intl'
import { useFormatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useStocksQuery } from '@/lib/queries/stocks'
import { useAssetPricesQuery } from '@/lib/queries/prices'

export default function StocksSummary() {
  const t = useTranslations('summaryCards')
  const tStocks = useTranslations('holdings.stocks')
  const { data: stocks = [], isLoading: stocksLoading } = useStocksQuery()
  const { data: prices = [], isLoading: pricesLoading } = useAssetPricesQuery()
  const formatCurrency = useFormatCurrency()

  if (stocksLoading || pricesLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  const getPrice = (ticker: string) =>
    prices.find((p) => p.ticker === ticker)?.price ?? 0

  const totalValue = stocks.reduce(
    (sum, stock) => sum + stockShares(stock) * getPrice(stock.ticker),
    0
  )
  const totalCost = stocks.reduce(
    (sum, stock) => sum + stockShares(stock) * stock.averagePrice,
    0
  )
  const totalProfit = totalValue - totalCost
  const totalProfitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const isPositive = totalProfit >= 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4 border-l-4 border-l-blue-500">
        <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
        <p className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</p>
        <p className="text-xs text-muted-foreground mt-2">{tStocks('stockCount', { count: stocks.length })}</p>
      </Card>

      <Card className="p-4 border-l-4 border-l-purple-500">
        <p className="text-sm text-muted-foreground">{tStocks('totalCost')}</p>
        <p className="text-2xl font-bold mt-2">{formatCurrency(totalCost)}</p>
      </Card>

      <Card className={`p-4 border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('profitLoss')}</p>
            <p className={`text-2xl font-bold mt-2 flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          {isPositive ? (
            <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-600 opacity-50" />
          )}
        </div>
        <p className={`text-xs mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {totalProfitPercentage.toFixed(2)}%
        </p>
      </Card>
    </div>
  )
}
