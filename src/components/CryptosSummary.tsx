'use client'

import { useAssetStore } from '@/lib/useAssetStore'
import { useFormatCurrency } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function CryptosSummary() {
  const { cryptos, assetPrices } = useAssetStore()
  const formatCurrency = useFormatCurrency()
  const getPrice = (symbol: string) =>
    assetPrices.find((p) => p.ticker === symbol)?.price ?? 0

  const totalValue = cryptos.reduce((sum, c) => sum + c.quantity * getPrice(c.symbol), 0)
  const totalCost = cryptos.reduce((sum, c) => sum + c.quantity * c.averagePrice, 0)
  const profitLoss = totalValue - totalCost
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
  const isPositive = profitLoss >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 border-l-4 border-l-purple-500">
        <p className="text-sm font-medium text-muted-foreground">Total Value</p>
        <p className="text-3xl font-bold mt-2">{formatCurrency(totalValue)}</p>
      </Card>

      <Card className="p-6 border-l-4 border-l-blue-500">
        <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
        <p className="text-3xl font-bold mt-2">{formatCurrency(totalCost)}</p>
      </Card>

      <Card className={`p-6 border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Profit / Loss</p>
            <p className={`text-3xl font-bold mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitLoss)}
            </p>
          </div>
          <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? (
              <TrendingUp className="w-8 h-8" />
            ) : (
              <TrendingDown className="w-8 h-8" />
            )}
          </div>
        </div>
        <p className={`text-sm font-medium mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {profitLossPercent.toFixed(2)}%
        </p>
      </Card>
    </div>
  )
}
