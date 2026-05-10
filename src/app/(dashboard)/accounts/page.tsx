'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import AccountForm from '@/components/AccountForm'
import AccountCard from '@/components/AccountCard'
import PageLoader from '@/components/PageLoader'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAssetStore } from '@/lib/useAssetStore'
import { Wallet } from 'lucide-react'

export default function AccountsPage() {
  const { accounts, addAccount, deleteAccount, getAccountBalance } = useAssetStore()
  const hasHydrated = useAssetStore((s) => s.hasHydrated)
  const [showForm, setShowForm] = useState(false)
  const [hideZeroBalance, setHideZeroBalance] = useState(false)

  if (!hasHydrated) {
    return <PageLoader />
  }

  const handleAddAccount = (data: any) => {
    addAccount(data)
    setShowForm(false)
  }

  const visibleAccounts = hideZeroBalance
    ? accounts.filter((account) => Math.max(getAccountBalance(account.id), 0) > 0)
    : accounts

  const hiddenCount = accounts.length - visibleAccounts.length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage Accounts</h1>
          <p className="text-muted-foreground">Create and manage your bank, deposit, and cash accounts</p>
        </div>

        {showForm && (
          <div className="bg-muted p-6 rounded-lg border border-border">
            <AccountForm onSubmit={handleAddAccount} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {!showForm && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Wallet className="w-4 h-4" />
              Add New Account
            </button>

            {accounts.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="accounts-page-hide-zero"
                  checked={hideZeroBalance}
                  onCheckedChange={(checked) => setHideZeroBalance(checked === true)}
                />
                <Label
                  htmlFor="accounts-page-hide-zero"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide 0 balance
                  {hiddenCount > 0 && hideZeroBalance && (
                    <span className="text-muted-foreground"> ({hiddenCount})</span>
                  )}
                </Label>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              balance={getAccountBalance(account.id)}
              onDelete={deleteAccount}
            />
          ))}
        </div>

        {accounts.length > 0 && visibleAccounts.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            All accounts have a 0 balance. Uncheck &ldquo;Hide 0 balance&rdquo; to see them.
          </div>
        )}

        {accounts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground mb-6">Create your first account to get started</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
