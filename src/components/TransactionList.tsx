'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Account, Transaction } from '@/lib/types'
import { useFormatCurrency, useFormatDateTime } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, SquareArrowOutUpRight, SquareArrowRight, Trash2 } from 'lucide-react'
import { getTransactionTextColor, getTransactionSymbol } from '@/lib/transaction'

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
  const t = useTranslations('transactions')
  const tDash = useTranslations('dashboard')
  const locale = useLocale()
  const localeTag = locale === 'id' ? 'id-ID' : 'en-US'
  const formatCurrency = useFormatCurrency()
  const formatDateTime = useFormatDateTime()

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || t('unknownAccount')
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{tDash('noTransactions')}</h3>
          <p className="text-muted-foreground">{tDash('noTransactionsHint')}</p>
        </div>
      </Card>
    )
  }

  // Group transactions by date
  const groupedByDate = transactions.reduce(
    (acc, tx) => {
      const date = new Date(tx.date).toLocaleDateString(localeTag, {
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
                
                let label = ''
                let bgColor = 'bg-blue-500'
                let amountColor = getTransactionTextColor(tx);
                let iconColor = amountColor;
                const amountPrefix = getTransactionSymbol(tx);

                if (isTopup) {
                  label = `${t('topup')} → ${getAccountName(tx.toAccountId!)}`
                  bgColor = 'bg-emerald-500';
                  iconColor = 'text-white';

                } else if (isWithdrawal) {
                  label = `${getAccountName(tx.fromAccountId!)} → ${t('withdrawal')}`
                  bgColor = 'bg-secondary'
                } else {
                  label = `${getAccountName(tx.fromAccountId!)} → ${getAccountName(tx.toAccountId!)}`
                  iconColor = 'text-white';
                }

                const iconClass = `w-5 h-5 ${iconColor}`;

                return (
                  <div
                    key={tx.id}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${bgColor} flex items-center justify-center`}>
                          {isTopup && <SquareArrowRight className={iconClass} />}
                          {isWithdrawal && <SquareArrowOutUpRight className={iconClass} />}
                          {!isTopup && !isWithdrawal && <ArrowRight className={iconClass} />}
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
                          if (confirm(t('deleteConfirmPrompt'))) {
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
