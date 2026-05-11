'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DailyBalance, Account } from '@/lib/types'
import {
  useFormatCurrency,
  formatDateShort,
  formatMonth,
  HIDDEN_VALUE_MASK,
} from '@/lib/format'
import { useUIStore } from '@/lib/store/useUIStore'

interface BalanceChartProps {
  data: DailyBalance[]
  accounts: Account[]
  viewType: 'day' | 'month' | 'year'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type ChartMode = 'total' | 'per-account'

function formatTooltipDate(rawDate: string, viewType: 'day' | 'month' | 'year'): string {
  const [year, _month, date] = rawDate.split('-')

  if (viewType === 'month') {
    return formatMonth(rawDate);
  }
  
  if (viewType === 'day') {
    return `${date} ${formatMonth(rawDate)}`
  }
  return year
}

function getPrefixLabel(viewType: BalanceChartProps['viewType']) {
  if (viewType === 'day') {
    return 'Date';
  }

  if (viewType === 'month') {
    return 'Month';
  }

  return 'Year';
}

export default function BalanceChart({
  data,
  accounts,
  viewType,
}: BalanceChartProps) {
  const [mode, setMode] = useState<ChartMode>('total')
  const [hiddenAccounts, setHiddenAccounts] = useState<Set<string>>(new Set())
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)

  useEffect(() => {
    setHiddenAccounts((prev) => {
      const valid = new Set(accounts.map((a) => a.id))
      const next = new Set<string>()
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id)
      })
      return next.size === prev.size ? prev : next
    })
  }, [accounts])

  const chartData = useMemo(() => {
    return data.map((item) => {
      const total = Object.entries(item.balances).reduce(
        (sum, [accountId, v]) => (hiddenAccounts.has(accountId) ? sum : sum + v),
        0,
      )
      return {
        ...item,
        total,
        rawDate: item.date,
        name:
          viewType === 'day'
            ? formatDateShort(item.date)
            : viewType === 'month'
              ? formatMonth(item.date)
              : item.date,
      }
    })
  }, [data, viewType, hiddenAccounts])

  const visibleAccounts = useMemo(
    () => accounts.filter((a) => !hiddenAccounts.has(a.id)),
    [accounts, hiddenAccounts],
  )

  const toggleAccount = (id: string) => {
    setHiddenAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

      {mode === 'per-account' && accounts.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          {accounts.map((account, index) => {
            const color = COLORS[index % COLORS.length]
            const isHidden = hiddenAccounts.has(account.id)
            return (
              <label
                key={account.id}
                className="flex items-center gap-2 text-sm cursor-pointer select-none"
              >
                <Checkbox
                  checked={!isHidden}
                  onCheckedChange={() => toggleAccount(account.id)}
                  style={
                    !isHidden
                      ? {
                          backgroundColor: color,
                          borderColor: color,
                          color: '#fff',
                        }
                      : undefined
                  }
                />
                <span
                  className={
                    isHidden ? 'text-muted-foreground line-through' : 'text-foreground'
                  }
                >
                  {account.name}
                </span>
              </label>
            )
          })}
        </div>
      )}

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
            tickFormatter={(value) =>
              hideValues ? HIDDEN_VALUE_MASK : `${(value / 1000000).toFixed(0)}M`
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
              const raw = payload?.[0]?.payload?.rawDate as string | undefined;
              return `${getPrefixLabel(viewType)}: ${raw ? formatTooltipDate(raw, viewType) : _label}`
            }}
          />

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
            visibleAccounts.map((account) => {
              const colorIndex = accounts.findIndex((a) => a.id === account.id)
              return (
                <Line
                  key={account.id}
                  type="monotone"
                  dataKey={`balances.${account.id}`}
                  name={account.name}
                  stroke={COLORS[colorIndex % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )
            })
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
