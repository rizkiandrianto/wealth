'use client'

import { Account, Transaction } from '@/lib/types'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Trash2 } from 'lucide-react'

interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  onDelete: (id: string) => void
}

export default function TransactionList({
  transactions,
  accounts,
  onDelete,
}: TransactionListProps) {
  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || 'Unknown'
  }

  const getAccountCurrency = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.currency || 'IDR'
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
          <p className="text-muted-foreground">Start by recording your first transaction</p>
        </div>
      </Card>
    )
  }

  // Group transactions by date
  const groupedByDate = transactions.reduce(
    (acc, tx) => {
      const date = new Date(tx.date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(tx)
      return acc
    },
    {} as Record<string, Transaction[]>
  )

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {date}
          </h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {groupedByDate[date].map((tx) => {
                const isTopup = !tx.fromAccountId && tx.toAccountId
                const isWithdrawal = tx.fromAccountId && !tx.toAccountId
                const isTransfer = tx.fromAccountId && tx.toAccountId
                
                let label = ''
                let bgColor = 'from-blue-50 to-blue-100'
                let iconColor = 'text-blue-600'
                let amountColor = 'text-green-600'
                let amountPrefix = '+'
                
                if (isTopup) {
                  label = `Topup → ${getAccountName(tx.toAccountId!)}`
                  bgColor = 'from-green-50 to-green-100'
                  iconColor = 'text-green-600'
                } else if (isWithdrawal) {
                  label = `${getAccountName(tx.fromAccountId!)} → Withdrawal`
                  bgColor = 'from-orange-50 to-orange-100'
                  iconColor = 'text-orange-600'
                  amountColor = 'text-orange-600'
                  amountPrefix = '-'
                } else {
                  label = `${getAccountName(tx.fromAccountId!)} → ${getAccountName(tx.toAccountId!)}`
                }

                return (
                  <div
                    key={tx.id}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center`}>
                          <ArrowRight className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(tx.date)}
                            {tx.description && ` • ${tx.description}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-lg font-bold ${amountColor}`}>
                        {amountPrefix}{formatCurrency(tx.amount)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            onDelete(tx.id)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
