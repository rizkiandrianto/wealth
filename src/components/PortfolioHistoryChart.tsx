'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DateRange } from 'react-day-picker'
import ChartCard from '@/components/history/ChartCard'
import ModeToggle from '@/components/history/ModeToggle'
import ViewTypeSelector, { type ViewType } from '@/components/history/ViewTypeSelector'
import {
  usePortfolioSnapshotsQuery,
  type PortfolioSnapshot,
} from '@/lib/queries/portfolioSnapshots'
import {
  useFormatCurrency,
  formatDateShort,
  formatMonth,
  getMonthFromDate,
  getYearFromDate,
  HIDDEN_VALUE_MASK,
} from '@/lib/format'
import { useUIStore } from '@/lib/store/useUIStore'

type ChartMode = 'total' | 'breakdown'

const TOTAL_COLOR = '#10b981'

const MODE_OPTIONS = [
  { value: 'total' as const, label: 'Total' },
  { value: 'breakdown' as const, label: 'Breakdown' },
]

const BREAKDOWN_SERIES: ReadonlyArray<{
  key: keyof Pick<PortfolioSnapshot, 'cashValue' | 'stockValue' | 'cryptoValue' | 'goldValue'>
  name: string
  color: string
}> = [
  { key: 'cashValue', name: 'Cash', color: '#3b82f6' },
  { key: 'stockValue', name: 'Saham', color: '#a855f7' },
  { key: 'cryptoValue', name: 'Crypto', color: '#f97316' },
  { key: 'goldValue', name: 'Emas', color: '#eab308' },
]

function formatTickLabel(rawDate: string, viewType: ViewType): string {
  if (viewType === 'year') return rawDate.slice(0, 4)
  if (viewType === 'month') return formatMonth(rawDate)
  return formatDateShort(rawDate)
}

function formatTooltipDate(rawDate: string, viewType: ViewType): string {
  if (viewType === 'year') return rawDate.slice(0, 4)
  if (viewType === 'month') return formatMonth(rawDate)
  const [, , day] = rawDate.split('-')
  return `${day} ${formatMonth(rawDate)}`
}

function aggregateByPeriod(data: PortfolioSnapshot[], viewType: ViewType): PortfolioSnapshot[] {
  if (viewType === 'day') return data
  const keyFn = viewType === 'month' ? getMonthFromDate : getYearFromDate
  const byPeriod = new Map<string, PortfolioSnapshot>()
  data.forEach((d) => byPeriod.set(keyFn(d.date), d))
  return Array.from(byPeriod.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PortfolioHistoryChart() {
  const range = useUIStore((s) => s.historyRange)
  const setRange = useUIStore((s) => s.setHistoryRange)
  const viewType = useUIStore((s) => s.historyViewType)
  const setViewType = useUIStore((s) => s.setHistoryViewType)
  const [mode, setMode] = useState<ChartMode>('total')
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined)
  const { data = [], isLoading } = usePortfolioSnapshotsQuery(range)
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)

  const filteredData = useMemo(() => {
    if (!dateFilter?.from && !dateFilter?.to) return data
    const fromStr = dateFilter?.from ? toIsoDate(dateFilter.from) : ''
    const toStr = dateFilter?.to ? toIsoDate(dateFilter.to) : ''
    return data.filter((item) => {
      if (fromStr && item.date < fromStr) return false
      if (toStr && item.date > toStr) return false
      return true
    })
  }, [data, dateFilter])

  const chartData = useMemo(() => {
    const aggregated = aggregateByPeriod(filteredData, viewType)
    return aggregated.map((d) => ({
      ...d,
      rawDate: d.date,
      name: formatTickLabel(d.date, viewType),
    }))
  }, [filteredData, viewType])

  return (
    <div className="space-y-6">
      <ViewTypeSelector value={viewType} onChange={setViewType} />

      <ChartCard
        title="Portfolio Value Trend"
        headerRight={<ModeToggle options={MODE_OPTIONS} value={mode} onChange={setMode} />}
        range={range}
        onRangeChange={setRange}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        isLoading={isLoading}
        isEmpty={chartData.length === 0}
        emptyMessage="No portfolio history for this range."
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) =>
                hideValues ? HIDDEN_VALUE_MASK : `${(value / 1_000_000).toFixed(0)}M`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(_label, payload) => {
                const raw = payload?.[0]?.payload?.rawDate as string | undefined
                return raw ? formatTooltipDate(raw, viewType) : String(_label)
              }}
              labelClassName="text-black"
            />

            {mode === 'total' ? (
              <Line
                type="monotone"
                dataKey="totalValue"
                name="Total"
                stroke={TOTAL_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : (
              BREAKDOWN_SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
