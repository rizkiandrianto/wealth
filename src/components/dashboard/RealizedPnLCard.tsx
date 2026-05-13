'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useStockSalesSummaryQuery } from '@/lib/queries/stocks'
import { useCryptoSalesSummaryQuery } from '@/lib/queries/crypto'
import { useGoldSalesSummaryQuery } from '@/lib/queries/gold'

export default function RealizedPnLCard() {
  const formatCurrency = useFormatCurrency()
  const { data: stockSummary, isLoading: stockLoading } = useStockSalesSummaryQuery()
  const { data: cryptoSummary, isLoading: cryptoLoading } = useCryptoSalesSummaryQuery()
  const { data: goldSummary, isLoading: goldLoading } = useGoldSalesSummaryQuery()

  if (stockLoading || cryptoLoading || goldLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  const stockCount = stockSummary?.count ?? 0
  const cryptoCount = cryptoSummary?.count ?? 0
  const goldCount = goldSummary?.count ?? 0

  if (stockCount === 0 && cryptoCount === 0 && goldCount === 0) return null

  const stocksPnL = stockSummary?.totalRealizedPnL ?? 0
  const cryptosPnL = cryptoSummary?.totalRealizedPnL ?? 0
  const goldsPnL = goldSummary?.totalRealizedPnL ?? 0
  const totalPnL = stocksPnL + cryptosPnL + goldsPnL

  return (
    <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Realized P&L</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {stockCount} stock sales • {cryptoCount} crypto sales
            {goldCount > 0 && ` • ${goldCount} gold sales`}
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-bold">{formatCurrency(totalPnL)}</p>
            {(stocksPnL !== 0 || cryptosPnL !== 0 || goldsPnL !== 0) && (
              <div className="text-sm space-y-1 text-muted-foreground">
                {stocksPnL !== 0 && (
                  <p className={stocksPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Stocks: {formatCurrency(stocksPnL)}
                  </p>
                )}
                {cryptosPnL !== 0 && (
                  <p className={cryptosPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Cryptos: {formatCurrency(cryptosPnL)}
                  </p>
                )}
                {goldsPnL !== 0 && (
                  <p className={goldsPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Gold: {formatCurrency(goldsPnL)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
