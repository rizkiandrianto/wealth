'use client'

import { useMemo, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import BalanceChart from '@/components/BalanceChart'
import HistoryTable from '@/components/HistoryTable'
import PageLoader from '@/components/PageLoader'
import { useAssetStore } from '@/lib/useAssetStore'
import { getMonthFromDate, getYearFromDate } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

type ViewType = 'day' | 'month' | 'year'

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function HistoryPage() {
  const { accounts, dailyBalances } = useAssetStore()
  const hasHydrated = useAssetStore((s) => s.hasHydrated)
  const [viewType, setViewType] = useState<ViewType>('month')
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  const rangedBalances = useMemo(() => {
    if (!range?.from && !range?.to) return dailyBalances
    const fromStr = range?.from ? toIsoDate(range.from) : ''
    const toStr = range?.to ? toIsoDate(range.to) : ''
    return dailyBalances.filter((item) => {
      if (fromStr && item.date < fromStr) return false
      if (toStr && item.date > toStr) return false
      return true
    })
  }, [dailyBalances, range])

  const filteredData = useMemo(() => {
    if (rangedBalances.length === 0) return []

    if (viewType === 'day') {
      return rangedBalances
    }

    if (viewType === 'month') {
      const byMonth = new Map<string, typeof rangedBalances[0]>()
      rangedBalances.forEach((item) => {
        const month = getMonthFromDate(item.date)
        byMonth.set(month, item)
      })
      return Array.from(byMonth.values()).sort((a, b) => a.date.localeCompare(b.date))
    }

    const byYear = new Map<string, typeof rangedBalances[0]>()
    rangedBalances.forEach((item) => {
      const year = getYearFromDate(item.date)
      byYear.set(year, item)
    })
    return Array.from(byYear.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [rangedBalances, viewType])

  const rangeLabel = useMemo(() => {
    if (!range?.from && !range?.to) return 'All dates'
    if (range?.from && range?.to) {
      return `${format(range.from, 'dd MMM yyyy')} – ${format(range.to, 'dd MMM yyyy')}`
    }
    if (range?.from) return `From ${format(range.from, 'dd MMM yyyy')}`
    if (range?.to) return `Until ${format(range.to, 'dd MMM yyyy')}`
    return 'All dates'
  }, [range])

  if (!hasHydrated) {
    return <PageLoader />
  }

  if (accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Historical Data</h1>
            <p className="text-muted-foreground">View your balance history over time</p>
          </div>

          <Card className="p-8">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground">
                Create accounts and record transactions to see your balance history
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Historical Data</h1>
          <p className="text-muted-foreground">View your balance trends and history</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(['day', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  viewType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                By {type}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  {rangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {(range?.from || range?.to) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setRange(undefined)}
                aria-label="Clear date filter"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {filteredData.length > 0 ? (
          <BalanceChart data={filteredData} accounts={accounts} viewType={viewType} />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No data available for the selected range.</p>
          </Card>
        )}

        <HistoryTable data={filteredData} accounts={accounts} viewType={viewType} />
      </div>
    </DashboardLayout>
  )
}
