'use client'

import { useTranslations } from 'next-intl'
import { useFormatCurrency } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useGoldsQuery } from '@/lib/queries/gold'
import { useAssetPricesQuery } from '@/lib/queries/prices'

export default function GoldSummary() {
  const t = useTranslations('summaryCards')
  const tStocks = useTranslations('holdings.stocks')
  const { data: golds = [], isLoading: goldsLoading } = useGoldsQuery()
  const { data: prices = [], isLoading: pricesLoading } = useAssetPricesQuery()
  const formatCurrency = useFormatCurrency()

  if (goldsLoading || pricesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    )
  }

  const goldPrice = prices.find((p) => p.ticker === 'XAU')?.price ?? 0
  const totalWeight = golds.reduce((sum, g) => sum + g.weight, 0)
  const totalValue = golds.reduce((sum, g) => sum + g.weight * goldPrice, 0)
  const totalCost = golds.reduce((sum, g) => sum + g.weight * g.purchasePrice, 0)
  const profitLoss = totalValue - totalCost
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
  const isPositive = profitLoss >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6 border-l-4 border-l-yellow-500">
        <p className="text-sm font-medium text-muted-foreground">{t('totalWeight')}</p>
        <p className="text-3xl font-bold mt-2">{totalWeight.toFixed(4)} g</p>
      </Card>

      <Card className="p-6 border-l-4 border-l-yellow-400">
        <p className="text-sm font-medium text-muted-foreground">{t('totalValue')}</p>
        <p className="text-3xl font-bold mt-2">{goldPrice > 0 ? formatCurrency(totalValue) : '—'}</p>
        {goldPrice > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(goldPrice)}/gram</p>
        )}
      </Card>

      <Card className="p-6 border-l-4 border-l-blue-500">
        <p className="text-sm font-medium text-muted-foreground">{tStocks('totalCost')}</p>
        <p className="text-3xl font-bold mt-2">{formatCurrency(totalCost)}</p>
      </Card>

      <Card className={`p-6 border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('profitLoss')}</p>
            <p className={`text-3xl font-bold mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {goldPrice > 0 ? formatCurrency(profitLoss) : '—'}
            </p>
          </div>
          <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
          </div>
        </div>
        {goldPrice > 0 && (
          <p className={`text-sm font-medium mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {profitLossPercent.toFixed(2)}%
          </p>
        )}
      </Card>
    </div>
  )
}
