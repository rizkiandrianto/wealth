'use client'

import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import BalanceChart from '@/components/BalanceChart'
import HistoryTable from '@/components/HistoryTable'
import { useAssetStore } from '@/lib/useAssetStore'
import { getMonthFromDate, getYearFromDate } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

type ViewType = 'day' | 'month' | 'year'

export default function HistoryPage() {
  const { accounts, dailyBalances } = useAssetStore()
  const [viewType, setViewType] = useState<ViewType>('month')

  const filteredData = useMemo(() => {
    if (dailyBalances.length === 0) return []

    if (viewType === 'day') {
      return dailyBalances
    }

    if (viewType === 'month') {
      // Group by month, taking last day of each month
      const byMonth = new Map<string, typeof dailyBalances[0]>()
      dailyBalances.forEach((item) => {
        const month = getMonthFromDate(item.date)
        byMonth.set(month, item)
      })
      return Array.from(byMonth.values()).sort((a, b) => a.date.localeCompare(b.date))
    }

    // viewType === 'year'
    const byYear = new Map<string, typeof dailyBalances[0]>()
    dailyBalances.forEach((item) => {
      const year = getYearFromDate(item.date)
      byYear.set(year, item)
    })
    return Array.from(byYear.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [dailyBalances, viewType])

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

        {/* View Type Toggle */}
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

        {/* Chart */}
        {filteredData.length > 0 ? (
          <BalanceChart data={filteredData} accounts={accounts} viewType={viewType} />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No data available. Start recording transactions to see your history.</p>
          </Card>
        )}

        {/* Table */}
        <HistoryTable data={filteredData} accounts={accounts} viewType={viewType} />
      </div>
    </DashboardLayout>
  )
}
