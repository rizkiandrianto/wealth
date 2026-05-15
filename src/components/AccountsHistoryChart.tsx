'use client'

import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import BalanceChart, { type BalanceChartMode } from '@/components/BalanceChart'
import HistoryTable from '@/components/HistoryTable'
import ChartCard from '@/components/history/ChartCard'
import ModeToggle from '@/components/history/ModeToggle'
import ViewTypeSelector from '@/components/history/ViewTypeSelector'
import { useAccountSnapshotsQuery } from '@/lib/queries/accountSnapshots'
import { buildDailyBalancesFromSnapshots } from '@/lib/calculations/dailyBalances'
import { getMonthFromDate, getYearFromDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/lib/store/useUIStore'
import type { Account } from '@/lib/types'

const BALANCE_MODE_OPTIONS = [
  { value: 'total' as const, label: 'Total' },
  { value: 'per-account' as const, label: 'Per Account' },
]

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface AccountsHistoryChartProps {
  accounts: Account[]
}

export default function AccountsHistoryChart({ accounts }: AccountsHistoryChartProps) {
  const range = useUIStore((s) => s.historyRange)
  const setRange = useUIStore((s) => s.setHistoryRange)
  const viewType = useUIStore((s) => s.historyViewType)
  const setViewType = useUIStore((s) => s.setHistoryViewType)
  const [mode, setMode] = useState<BalanceChartMode>('total')
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined)
  const { data: snapshots = [], isLoading: snapshotsLoading } = useAccountSnapshotsQuery(range)

  const dailyBalances = useMemo(
    () => buildDailyBalancesFromSnapshots(accounts, snapshots),
    [accounts, snapshots],
  )

  const rangedBalances = useMemo(() => {
    if (!dateFilter?.from && !dateFilter?.to) return dailyBalances
    const fromStr = dateFilter?.from ? toIsoDate(dateFilter.from) : ''
    const toStr = dateFilter?.to ? toIsoDate(dateFilter.to) : ''
    return dailyBalances.filter((item) => {
      if (fromStr && item.date < fromStr) return false
      if (toStr && item.date > toStr) return false
      return true
    })
  }, [dailyBalances, dateFilter])

  const filteredData = useMemo(() => {
    if (rangedBalances.length === 0) return []
    if (viewType === 'day') return rangedBalances
    const keyFn = viewType === 'month' ? getMonthFromDate : getYearFromDate
    const byPeriod = new Map<string, (typeof rangedBalances)[0]>()
    rangedBalances.forEach((item) => byPeriod.set(keyFn(item.date), item))
    return Array.from(byPeriod.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [rangedBalances, viewType])

  return (
    <div className="space-y-6">
      <ViewTypeSelector value={viewType} onChange={setViewType} />

      <ChartCard
        title="Account Balance Trend"
        headerRight={<ModeToggle options={BALANCE_MODE_OPTIONS} value={mode} onChange={setMode} />}
        range={range}
        onRangeChange={setRange}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        isLoading={snapshotsLoading}
        isEmpty={filteredData.length === 0}
      >
        <BalanceChart data={filteredData} accounts={accounts} viewType={viewType} mode={mode} />
      </ChartCard>

      {snapshotsLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <HistoryTable data={filteredData} accounts={accounts} viewType={viewType} />
      )}
    </div>
  )
}
