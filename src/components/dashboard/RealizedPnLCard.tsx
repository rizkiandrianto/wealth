'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useStockSalesQuery } from '@/lib/queries/stocks'
import { useCryptoSalesQuery } from '@/lib/queries/crypto'
import { useGoldSalesQuery } from '@/lib/queries/gold'

export default function RealizedPnLCard() {
  const formatCurrency = useFormatCurrency()
  const { data: stockSales = [], isLoading: stockLoading } = useStockSalesQuery()
  const { data: cryptoSales = [], isLoading: cryptoLoading } = useCryptoSalesQuery()
  const { data: goldSales = [], isLoading: goldLoading } = useGoldSalesQuery()

  if (stockLoading || cryptoLoading || goldLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  if (stockSales.length === 0 && cryptoSales.length === 0 && goldSales.length === 0) return null

  const stocksPnL = stockSales.reduce((s, sale) => s + sale.realizedPnL, 0)
  const cryptosPnL = cryptoSales.reduce((s, sale) => s + sale.realizedPnL, 0)
  const goldsPnL = goldSales.reduce((s, sale) => s + sale.realizedPnL, 0)
  const totalPnL = stocksPnL + cryptosPnL + goldsPnL

  return (
    <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Realized P&L</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {stockSales.length} stock sales • {cryptoSales.length} crypto sales
            {goldSales.length > 0 && ` • ${goldSales.length} gold sales`}
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
