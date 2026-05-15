'use client'

import { Account, DailyBalance } from '@/lib/types'
import { useFormatCurrency, formatDate, formatMonth } from '@/lib/format'
import { Card } from '@/components/ui/card'

interface HistoryTableProps {
  data: DailyBalance[]
  accounts: Account[]
  viewType: 'day' | 'month' | 'year'
}

export default function HistoryTable({
  data,
  accounts,
  viewType,
}: HistoryTableProps) {
  const formatCurrency = useFormatCurrency()

  if (data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No history data available yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                {viewType === 'day' ? 'Date' : viewType === 'month' ? 'Month' : 'Year'}
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                Total Balance
              </th>
              {accounts.map((account) => (
                <th
                  key={account.id}
                  className="px-6 py-3 text-right text-sm font-semibold text-foreground"
                >
                  {account.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => {
              const total = Object.values(item.balances).reduce((sum, val) => sum + val, 0)

              return (
                <tr key={item.date} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    {viewType === 'day'
                      ? formatDate(item.date)
                      : viewType === 'month'
                        ? formatMonth(item.date)
                        : item.date}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-blue-600 dark:text-primary">
                    {formatCurrency(total, 'IDR')}
                  </td>
                  {accounts.map((account) => (
                    <td
                      key={account.id}
                      className="px-6 py-3 text-right text-sm text-foreground font-medium"
                    >
                      {formatCurrency(item.balances[account.id] || 0, account.currency)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
