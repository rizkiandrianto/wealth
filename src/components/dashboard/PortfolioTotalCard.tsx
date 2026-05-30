'use client'

import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { useStocksSummaryQuery } from '@/lib/queries/stocks'
import { useCryptosSummaryQuery } from '@/lib/queries/crypto'
import { useGoldsSummaryQuery } from '@/lib/queries/gold'
import type { SnapshotRange } from '@/lib/snapshot'
import type { PortfolioSlice } from '@/lib/portfolioMeta'

import PortfolioInfo from './portfolio-total/PortfolioInfo'
import PortfolioTrend from './portfolio-total/PortfolioTrend'
import AllocationDonut from './portfolio-total/AllocationDonut'
import PortfolioTotalSkeleton from './portfolio-total/PortfolioTotalSkeleton'

export default function PortfolioTotalCard() {
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)

  const [range, setRange] = useState<SnapshotRange>('1m')

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery()
  const { data: stockSummary, isLoading: stocksLoading } = useStocksSummaryQuery()
  const { data: cryptoSummary, isLoading: cryptosLoading } = useCryptosSummaryQuery()
  const { data: goldSummary, isLoading: goldsLoading } = useGoldsSummaryQuery()

  if (accountsLoading || stocksLoading || cryptosLoading || goldsLoading) {
    return <PortfolioTotalSkeleton />
  }

  const totalCash = accounts.reduce((s, a) => s + a.balance, 0)
  const totalStockValue = stockSummary?.totalValue ?? 0
  const totalStockCost = stockSummary?.totalCost ?? 0
  const totalCryptoValue = cryptoSummary?.totalValue ?? 0
  const totalCryptoCost = cryptoSummary?.totalCost ?? 0
  const totalGoldValue = goldSummary?.totalValue ?? 0
  const totalGoldCost = goldSummary?.totalCost ?? 0

  const slices: ReadonlyArray<PortfolioSlice> = [
    { key: 'cash', labelKey: 'cash', value: totalCash },
    { key: 'stock', labelKey: 'stocks', value: totalStockValue },
    { key: 'crypto', labelKey: 'crypto', value: totalCryptoValue },
    { key: 'gold', labelKey: 'gold', value: totalGoldValue },
  ]

  const includedTotal = slices.reduce(
    (sum, s) => (isExcluded(s.key) ? sum : sum + s.value),
    0,
  )

  const investedValue =
    (isExcluded('stock') ? 0 : totalStockValue) +
    (isExcluded('crypto') ? 0 : totalCryptoValue) +
    (isExcluded('gold') ? 0 : totalGoldValue)
  const investedCost =
    (isExcluded('stock') ? 0 : totalStockCost) +
    (isExcluded('crypto') ? 0 : totalCryptoCost) +
    (isExcluded('gold') ? 0 : totalGoldCost)
  const investedProfit = investedValue - investedCost
  const investedProfitPercent = investedCost > 0 ? (investedProfit / investedCost) * 100 : 0

  return (
    <Card className="p-6 bg-linear-to-br from-transparent to-emerald-100 border-emerald-200 dark:to-emerald-950/60 dark:border-emerald-900/70">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <PortfolioInfo
          total={includedTotal}
          slices={slices}
          investedCost={investedCost}
          investedProfit={investedProfit}
          investedProfitPercent={investedProfitPercent}
        />
        <PortfolioTrend range={range} onRangeChange={setRange} />
        <AllocationDonut slices={slices} />
      </div>
    </Card>
  )
}
