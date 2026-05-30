'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { formatDateShort, useFormatCurrency } from '@/lib/format'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import {
  usePortfolioSnapshotsQuery,
  type PortfolioSnapshot,
} from '@/lib/queries/portfolioSnapshots'
import type { SnapshotRange } from '@/lib/snapshot'
import { cn } from '@/lib/utils'
import PortfolioTrendChart from './PortfolioTrendChart'

const RANGE_TABS: ReadonlyArray<{ value: SnapshotRange; label: string }> = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
]

interface PortfolioTrendProps {
  range: SnapshotRange
  onRangeChange: (range: SnapshotRange) => void
}

export default function PortfolioTrend({ range, onRangeChange }: PortfolioTrendProps) {
  const t = useTranslations('dashboard')
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)
  const { data: snapshots = [], isLoading } = usePortfolioSnapshotsQuery(range)

  const chartData = useMemo(() => {
    return snapshots.map((s: PortfolioSnapshot) => {
      const value =
        (isExcluded('cash') ? 0 : s.cashValue) +
        (isExcluded('stock') ? 0 : s.stockValue) +
        (isExcluded('crypto') ? 0 : s.cryptoValue) +
        (isExcluded('gold') ? 0 : s.goldValue)
      return {
        date: s.date,
        name: formatDateShort(s.date),
        value,
      }
    })
  }, [snapshots, excludedPortfolios])

  return (
    <div className="lg:col-span-5 flex flex-col min-w-0">
      <div className="flex justify-center lg:justify-start">
        <div className="inline-flex rounded-full bg-white/60 dark:bg-emerald-950/40 p-1 gap-1">
          {RANGE_TABS.map((tab) => {
            const active = tab.value === range
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onRangeChange(tab.value)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-full transition-colors',
                  active
                    ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex-1 min-h-[180px]">
        <PortfolioTrendChart
          isLoading={isLoading}
          chartData={chartData}
          hideValues={hideValues}
          formatCurrency={formatCurrency}
          emptyLabel={t('noChartData')}
        />
      </div>
    </div>
  )
}
