'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { useAssetStore } from '@/lib/useAssetStore'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'

import { stockShares } from '@/lib/stock'

interface DashboardSummaryProps {
  totalBalance: number
  accountCount: number
  transactionCount: number
}

export default function DashboardSummary({
  totalBalance,
  accountCount,
  transactionCount,
}: DashboardSummaryProps) {
  const store = useAssetStore()

  const totalStockValue = store.getTotalStockValue()
  const totalStockCost = store.stocks.reduce((sum, stock) => sum + stockShares(stock) * stock.averagePrice, 0)
  const totalStockProfit = totalStockValue - totalStockCost
  const totalStockProfitPercent = totalStockCost > 0 ? (totalStockProfit / totalStockCost) * 100 : 0
  const isStockPositive = totalStockProfit >= 0

  const totalCryptoValue = store.getTotalCryptoValue()
  const totalCryptoCost = store.cryptos.reduce((sum, crypto) => sum + crypto.quantity * crypto.averagePrice, 0)
  const totalCryptoProfit = totalCryptoValue - totalCryptoCost
  const totalCryptoProfitPercent = totalCryptoCost > 0 ? (totalCryptoProfit / totalCryptoCost) * 100 : 0
  const isCryptoPositive = totalCryptoProfit >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>

      {store.stocks.length > 0 && (
          <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Portfolio Saham</h3>
                <p className="text-sm text-muted-foreground mt-1">{new Set(store.stocks.map((s) => s.ticker)).size} saham dimiliki</p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${isStockPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isStockPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {formatCurrency(totalStockProfit)} ({totalStockProfitPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <Link href="/stocks">
                <Button variant="outline" className="gap-2">
                  Lihat Detail
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

      {store.cryptos.length > 0 && (
          <Card className="p-6 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Portfolio Crypto</h3>
                <p className="text-sm text-muted-foreground mt-1">{new Set(store.cryptos.map((c) => c.symbol)).size} crypto dimiliki</p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${isCryptoPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isCryptoPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {formatCurrency(totalCryptoProfit)} ({totalCryptoProfitPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <Link href="/crypto">
                <Button variant="outline" className="gap-2">
                  Lihat Detail
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

      
    </div>
  )
}
