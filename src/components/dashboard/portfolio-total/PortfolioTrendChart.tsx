'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import { HIDDEN_VALUE_MASK } from '@/lib/format'

const TOTAL_COLOR = '#10b981'

interface PortfolioTrendChartProps {
  isLoading: boolean
  chartData: Array<{ date: string; name: string; value: number }>
  hideValues: boolean
  formatCurrency: (value: number) => string
  emptyLabel: string
}

export default function PortfolioTrendChart({
  isLoading,
  chartData,
  hideValues,
  formatCurrency,
  emptyLabel,
}: PortfolioTrendChartProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-full min-h-45" />
  }
  if (chartData.length === 0) {
    return (
      <div className="flex h-full min-h-45 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity={0.3} />
            <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          stroke="#9ca3af"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          orientation="right"
          stroke="#9ca3af"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={42}
          tickFormatter={(value) => (hideValues ? HIDDEN_VALUE_MASK : formatCompactIdr(value))}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [formatCurrency(value), '']}
          labelClassName="text-black"
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={TOTAL_COLOR}
          strokeWidth={2}
          fill="url(#portfolioTrendFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function formatCompactIdr(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}
