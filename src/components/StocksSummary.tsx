'use client'

import { useAssetStore } from '@/lib/useAssetStore'
import { formatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StocksSummary() {
  const { stocks, getStockValue, getStockProfitLoss, getTotalStockValue } = useAssetStore()

  const totalValue = getTotalStockValue()
  const totalCost = stocks.reduce((sum, stock) => sum + stockShares(stock) * stock.averagePrice, 0)
  const totalProfit = totalValue - totalCost
  const totalProfitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const isPositive = totalProfit >= 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4 border-l-4 border-l-blue-500">
        <p className="text-sm text-muted-foreground">Total Value</p>
        <p className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</p>
        <p className="text-xs text-muted-foreground mt-2">{stocks.length} saham</p>
      </Card>

      <Card className="p-4 border-l-4 border-l-purple-500">
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold mt-2">{formatCurrency(totalCost)}</p>
      </Card>

      <Card className={`p-4 border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Profit/Loss</p>
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
