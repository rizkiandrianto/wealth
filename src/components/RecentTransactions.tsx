'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/lib/types'
import { useFormatCurrency, useFormatDateTime } from '@/lib/format'
import { ArrowRight } from 'lucide-react'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { cn } from '@/lib/utils'
import { getTransactionSymbol } from '@/lib/transaction'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const t = useTranslations('dashboard')
  const tTx = useTranslations('transactions')
  const { data: accounts = [] } = useAccountsQuery()
  const formatCurrency = useFormatCurrency()
  const formatDateTime = useFormatDateTime()

  const getAccountName = (accountId: string | undefined) => {
    return accounts.find((a) => a.id === accountId)?.name || tTx('topup')
  }

  const getFlowLabel = (fromAccount: string | undefined, toAccount: string | undefined) => {
    const destinationName = getAccountName(toAccount);
    
    if (!fromAccount) {
      return `Topup to ${destinationName}`;
    }

    const sourceName = getAccountName(fromAccount)
    if (!toAccount) {
      return `Witdrawal from ${sourceName}`;
    }


    return `${sourceName} → ${destinationName}`;
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t('noTransactions')}</h3>
          <p className="text-muted-foreground mb-6">{t('noTransactionsHint')}</p>
          <Link href="/transactions">
            <Button>{tTx('addTransaction')}</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">{t('recentTransactions')}</h2>
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            {t('viewAll')}
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex-1">
                  <div className="md:flex flex-col md:flex-row items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">
                      {getFlowLabel(tx.fromAccountId, tx.toAccountId)}                      
                    </p>
                    {tx.description && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {tx.description}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(tx.date)}</p>
                </div>
                <p className={cn("text-lg font-bold", {
                  'text-green-600': !tx.fromAccountId && tx.toAccountId,
                  'text-red-600': !tx.toAccountId,
                  'text-foreground': tx.fromAccountId && tx.toAccountId
                })}>
                  {getTransactionSymbol(tx)}{formatCurrency(tx.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
