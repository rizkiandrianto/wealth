'use client'

// Required APIs:
//   GET    /api/accounts
//   GET    /api/transactions
//   DELETE /api/transactions/[id]
//   (POST  /api/transactions via AssetFormSheet → TransactionForm)

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import AssetFormSheet from '@/components/AssetFormSheet'
import TransactionList from '@/components/TransactionList'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { useTransactionsQuery, useDeleteTransaction } from '@/lib/queries/transactions'
import { ArrowRight } from 'lucide-react'

export default function TransactionsPage() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery()
  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery()
  const deleteTransaction = useDeleteTransaction()
  const [showForm, setShowForm] = useState(false)

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (accounts.length < 2) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Transactions</h1>
            <p className="text-muted-foreground">Record money transfers between your accounts</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <ArrowRight className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Need at least 2 accounts</h3>
            <p className="text-muted-foreground mb-6">
              Create at least 2 accounts before you can record transactions between them.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Transactions</h1>
            <p className="text-muted-foreground">Record and track money transfers between accounts</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4" />
            Record Transaction
          </button>
        </div>

        <AssetFormSheet
          type="transaction"
          open={showForm}
          onOpenChange={setShowForm}
        />

        {txLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            onDelete={(id) => { deleteTransaction.mutate(id) }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
