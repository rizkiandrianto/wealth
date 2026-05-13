'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/lib/types'
import { useFormatCurrency, formatDateTime } from '@/lib/format'
import { ArrowRight } from 'lucide-react'
import { useAccountsQuery } from '@/lib/queries/accounts'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { data: accounts = [] } = useAccountsQuery()
  const formatCurrency = useFormatCurrency()

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || 'Topup'
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p className="text-muted-foreground mb-6">Start by recording your first transaction</p>
          <Link href="/transactions">
            <Button>Record Transaction</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Transactions</h2>
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">
                      {getAccountName(tx.fromAccountId ?? "")} → {getAccountName(tx.toAccountId ?? "")}
                    </p>
                    {tx.description && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {tx.description}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(tx.date)}</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  +{formatCurrency(tx.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
