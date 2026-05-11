'use client'

import { Card } from '@/components/ui/card'
import { useFormatCurrency } from '@/lib/format'
import { useAssetStore } from '@/lib/useAssetStore'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import {
  ArrowRight,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
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
}: DashboardSummaryProps) {
  const store = useAssetStore()
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)
  const toggleHideValues = useUIStore((s) => s.toggleHideValues)
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const togglePortfolioExclusion = useUIStore((s) => s.togglePortfolioExclusion)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)

  const totalStockValue = store.getTotalStockValue()
  const totalStockCost = store.stocks.reduce(
    (sum, stock) => sum + stockShares(stock) * stock.averagePrice,
    0,
  )
  const totalStockProfit = totalStockValue - totalStockCost
  const totalStockProfitPercent =
    totalStockCost > 0 ? (totalStockProfit / totalStockCost) * 100 : 0
  const isStockPositive = totalStockProfit >= 0

  const totalCryptoValue = store.getTotalCryptoValue()
  const totalCryptoCost = store.cryptos.reduce(
    (sum, crypto) => sum + crypto.quantity * crypto.averagePrice,
    0,
  )
  const totalCryptoProfit = totalCryptoValue - totalCryptoCost
  const totalCryptoProfitPercent =
    totalCryptoCost > 0 ? (totalCryptoProfit / totalCryptoCost) * 100 : 0
  const isCryptoPositive = totalCryptoProfit >= 0

  const goldPrice = store.assetPrices.find((p) => p.ticker === 'XAU')?.price ?? 0
  const totalGoldWeight = store.golds.reduce((sum, g) => sum + g.weight, 0)
  const totalGoldValue = store.getTotalGoldValue()
  const totalGoldCost = store.golds.reduce(
    (sum, g) => sum + g.weight * g.purchasePrice,
    0,
  )
  const totalGoldProfit = totalGoldValue - totalGoldCost
  const totalGoldProfitPercent =
    totalGoldCost > 0 ? (totalGoldProfit / totalGoldCost) * 100 : 0
  const isGoldPositive = totalGoldProfit >= 0

  const totalPortfolio =
    (isExcluded('cash') ? 0 : totalBalance) +
    (isExcluded('stock') ? 0 : totalStockValue) +
    (isExcluded('crypto') ? 0 : totalCryptoValue) +
    (isExcluded('gold') ? 0 : totalGoldValue)
  const totalInvestedValue =
    (isExcluded('stock') ? 0 : totalStockValue) +
    (isExcluded('crypto') ? 0 : totalCryptoValue) +
    (isExcluded('gold') ? 0 : totalGoldValue)
  const totalInvestedCost =
    (isExcluded('stock') ? 0 : totalStockCost) +
    (isExcluded('crypto') ? 0 : totalCryptoCost) +
    (isExcluded('gold') ? 0 : totalGoldCost)
  const totalInvestedProfit = totalInvestedValue - totalInvestedCost
  const totalInvestedProfitPercent =
    totalInvestedCost > 0
      ? (totalInvestedProfit / totalInvestedCost) * 100
      : 0
  const isTotalPositive = totalInvestedProfit >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                Total Portfolio
              </p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(totalPortfolio)}</p>
              <div className="mt-3 text-sm text-muted-foreground space-y-1.5">
                <button
                  type="button"
                  onClick={() => togglePortfolioExclusion('cash')}
                  aria-pressed={!isExcluded('cash')}
                  className={`flex items-center gap-2 px-2 py-1 -mx-2 rounded-md hover:bg-emerald-200/40 transition-colors w-full text-left ${
                    isExcluded('cash') ? 'line-through opacity-50' : ''
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Cash: {formatCurrency(totalBalance)}</span>
                </button>
                {totalStockValue > 0 && (
                  <button
                    type="button"
                    onClick={() => togglePortfolioExclusion('stock')}
                    aria-pressed={!isExcluded('stock')}
                    className={`flex items-center gap-2 px-2 py-1 -mx-2 rounded-md hover:bg-emerald-200/40 transition-colors w-full text-left ${
                      isExcluded('stock') ? 'line-through opacity-50' : ''
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>Saham: {formatCurrency(totalStockValue)}</span>
                  </button>
                )}
                {totalCryptoValue > 0 && (
                  <button
                    type="button"
                    onClick={() => togglePortfolioExclusion('crypto')}
                    aria-pressed={!isExcluded('crypto')}
                    className={`flex items-center gap-2 px-2 py-1 -mx-2 rounded-md hover:bg-emerald-200/40 transition-colors w-full text-left ${
                      isExcluded('crypto') ? 'line-through opacity-50' : ''
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span>Crypto: {formatCurrency(totalCryptoValue)}</span>
                  </button>
                )}
                {totalGoldValue > 0 && (
                  <button
                    type="button"
                    onClick={() => togglePortfolioExclusion('gold')}
                    aria-pressed={!isExcluded('gold')}
                    className={`flex items-center gap-2 px-2 py-1 -mx-2 rounded-md hover:bg-emerald-200/40 transition-colors w-full text-left ${
                      isExcluded('gold') ? 'line-through opacity-50' : ''
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                    <span>Emas: {formatCurrency(totalGoldValue)}</span>
                  </button>
                )}
              </div>
              {totalInvestedCost > 0 && (
                <p
                  className={`text-sm font-medium flex items-center gap-1 mt-2 ${
                    isTotalPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isTotalPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatCurrency(totalInvestedProfit)} ({totalInvestedProfitPercent.toFixed(2)}%)
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={toggleHideValues}
                aria-label={hideValues ? 'Show values' : 'Hide values'}
                title={hideValues ? 'Show values' : 'Hide values'}
                className="w-12 h-12 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
              >
                {hideValues ? (
                  <EyeOff className="w-6 h-6 text-white" />
                ) : (
                  <Eye className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {(store.stocks.length > 0 || store.cryptos.length > 0 || store.golds.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {store.stocks.length > 0 && (
            <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Portfolio Saham</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Set(store.stocks.map((s) => s.ticker)).size} saham dimiliki
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                    <p
                      className={`text-sm font-medium flex items-center gap-1 ${
                        isStockPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
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
                    Detail
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Set(store.cryptos.map((c) => c.symbol)).size} crypto dimiliki
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</p>
                    <p
                      className={`text-sm font-medium flex items-center gap-1 ${
                        isCryptoPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
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
                    Detail
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {store.golds.length > 0 && (
            <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Portfolio Emas
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalGoldWeight.toFixed(2)} g
                    {totalGoldWeight > 0 && ` · avg ${formatCurrency(totalGoldCost / totalGoldWeight)}/g`}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-2xl font-bold">
                      {goldPrice > 0 ? formatCurrency(totalGoldValue) : '—'}
                    </p>
                    {totalGoldCost > 0 && goldPrice > 0 && (
                      <p
                        className={`text-sm font-medium flex items-center gap-1 ${
                          isGoldPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isGoldPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {formatCurrency(totalGoldProfit)} ({totalGoldProfitPercent.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                </div>
                <Link href="/gold">
                  <Button variant="outline" className="gap-2">
                    Detail
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
