'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { useStocksSummaryQuery } from '@/lib/queries/stocks'
import { useCryptosSummaryQuery } from '@/lib/queries/crypto'
import { useGoldsSummaryQuery } from '@/lib/queries/gold'
import { Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react'

export default function PortfolioTotalCard() {
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)
  const toggleHideValues = useUIStore((s) => s.toggleHideValues)
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const togglePortfolioExclusion = useUIStore((s) => s.togglePortfolioExclusion)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery()
  const { data: stockSummary, isLoading: stocksLoading } = useStocksSummaryQuery()
  const { data: cryptoSummary, isLoading: cryptosLoading } = useCryptosSummaryQuery()
  const { data: goldSummary, isLoading: goldsLoading } = useGoldsSummaryQuery()

  const anyLoading = accountsLoading || stocksLoading || cryptosLoading || goldsLoading

  if (anyLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-9 w-48 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-36" />
        </div>
      </Card>
    )
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalStockValue = stockSummary?.totalValue ?? 0
  const totalStockCost = stockSummary?.totalCost ?? 0
  const totalCryptoValue = cryptoSummary?.totalValue ?? 0
  const totalCryptoCost = cryptoSummary?.totalCost ?? 0
  const totalGoldValue = goldSummary?.totalValue ?? 0
  const totalGoldCost = goldSummary?.totalCost ?? 0

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
    totalInvestedCost > 0 ? (totalInvestedProfit / totalInvestedCost) * 100 : 0
  const isTotalPositive = totalInvestedProfit >= 0

  return (
    <Card className="p-6 bg-linear-to-br from-emerald-50 to-emerald-100 border-emerald-200">
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
  )
}
