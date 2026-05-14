'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useStockSalesSummaryQuery } from '@/lib/queries/stocks'
import { useCryptoSalesSummaryQuery } from '@/lib/queries/crypto'
import { useGoldSalesSummaryQuery } from '@/lib/queries/gold'
import { BarChart3 } from 'lucide-react'

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

  const breakdownItems: Array<{ label: string; value: number; show: boolean }> = [
    { label: 'Stocks', value: stocksPnL, show: stockCount > 0 },
    { label: 'Cryptos', value: cryptosPnL, show: cryptoCount > 0 },
    { label: 'Gold', value: goldsPnL, show: goldCount > 0 },
  ]
  const visibleBreakdown = breakdownItems.filter((item) => item.show)

  const countParts: string[] = []
  if (stockCount > 0) countParts.push(`${stockCount} stock sales`)
  if (cryptoCount > 0) countParts.push(`${cryptoCount} crypto sales`)
  if (goldCount > 0) countParts.push(`${goldCount} gold sales`)

  return (
    <Card className="p-6 bg-linear-to-br from-teal-50 to-transparent">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4 sm:shrink-0">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Realized P&L</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{countParts.join(' • ')}</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalPnL)}</p>
          </div>
        </div>
        {visibleBreakdown.length > 0 && (
          <>
            <div className="hidden sm:block self-stretch w-px bg-border" />
            <div className="border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:flex-1 sm:min-w-0 grid grid-cols-1 md:grid-cols-2">
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
                {visibleBreakdown.map((item) => {
                  const isPositive = item.value >= 0
                  return (
                    <div key={item.label} className="contents">
                      <span className="text-green-600 font-medium">{item.label}</span>
                      <span
                        className={`text-right tabular-nums ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
