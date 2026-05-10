'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { DailyBalance, Account } from '@/lib/types'
import { useFormatCurrency, formatDateShort, formatMonth, HIDDEN_VALUE_MASK } from '@/lib/format'
import { useUIStore } from '@/lib/store/useUIStore'

interface BalanceChartProps {
  data: DailyBalance[]
  accounts: Account[]
  viewType: 'day' | 'month' | 'year'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type ChartMode = 'total' | 'per-account'

export default function BalanceChart({
  data,
  accounts,
  viewType,
}: BalanceChartProps) {
  const [mode, setMode] = useState<ChartMode>('total')
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)

  const chartData = useMemo(() => {
    return data.map((item) => {
      const total = Object.values(item.balances).reduce((sum, v) => sum + v, 0)
      return {
        ...item,
        total,
        name:
          viewType === 'day'
            ? formatDateShort(item.date)
            : viewType === 'month'
              ? formatMonth(item.date)
              : item.date,
      }
    })
  }, [data, viewType])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Account Balance Trend</h3>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['total', 'per-account'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mode === m
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'total' ? 'Total' : 'Per Account'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => (hideValues ? HIDDEN_VALUE_MASK : `${(value / 1000000).toFixed(0)}M`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {mode === 'total' ? (
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ) : (
            accounts.map((account, index) => (
              <Line
                key={account.id}
                type="monotone"
                dataKey={`balances.${account.id}`}
                name={account.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
