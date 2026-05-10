'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import TransactionForm from '@/components/TransactionForm'
import TransactionList from '@/components/TransactionList'
import PageLoader from '@/components/PageLoader'
import { useAssetStore } from '@/lib/useAssetStore'
import { ArrowRight } from 'lucide-react'

export default function TransactionsPage() {
  const { accounts, transactions, addTransaction, deleteTransaction } = useAssetStore()
  const hasHydrated = useAssetStore((s) => s.hasHydrated)
  const [showForm, setShowForm] = useState(false)

  const handleAddTransaction = () => {
    setShowForm(false)
  }

  if (!hasHydrated) {
    return <PageLoader />
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
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">Record and track money transfers between accounts</p>
        </div>

        {showForm && (
          <div className="bg-muted p-6 rounded-lg border border-border">
            <TransactionForm
              accounts={accounts}
              onSubmit={(data) => {
                addTransaction(data)
                handleAddTransaction()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            Record Transaction
          </button>
        )}

        <TransactionList
          transactions={transactions}
          accounts={accounts}
          onDelete={deleteTransaction}
        />
      </div>
    </DashboardLayout>
  )
}
