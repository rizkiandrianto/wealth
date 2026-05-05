'use client'

import { useMemo } from 'react'
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
import { formatCurrency, formatDateShort, formatMonth } from '@/lib/format'

interface BalanceChartProps {
  data: DailyBalance[]
  accounts: Account[]
  viewType: 'day' | 'month' | 'year'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function BalanceChart({
  data,
  accounts,
  viewType,
}: BalanceChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name:
        viewType === 'day'
          ? formatDateShort(item.date)
          : viewType === 'month'
            ? formatMonth(item.date)
            : item.date,
    }))
  }, [data, viewType])

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6 text-foreground">Account Balance Trend</h3>
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
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
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

          {accounts.map((account, index) => (
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
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
