'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { Banknote, PiggyBank, Wallet, ChevronRight, Plus } from 'lucide-react'

interface AccountsListProps {
  defaultHideZeroBalance?: boolean;
  hideToolBar?: boolean;
}

const ACCOUNT_TYPE_ICONS = {
  bank: Banknote,
  deposit: PiggyBank,
  cash: Wallet,
}

const ACCOUNT_TYPE_COLORS = {
  bank: 'from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900/70',
  deposit: 'from-green-50 to-green-100 border-green-200 dark:from-green-950/40 dark:to-green-900/20 dark:border-green-900/70',
  cash: 'from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950/40 dark:to-yellow-900/20 dark:border-yellow-900/70',
}

export default function AccountsList({
  defaultHideZeroBalance = true,
  hideToolBar = false,
}: AccountsListProps) {
  const { data: accounts = [], isLoading } = useAccountsQuery()
  const [hideZeroBalance, setHideZeroBalance] = useState(defaultHideZeroBalance)
  const formatCurrency = useFormatCurrency()

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
          <p className="text-muted-foreground mb-6">Start by creating your first account</p>
          <Link href="/accounts">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  const visibleAccounts = hideZeroBalance
    ? accounts.filter((account) => Math.max(account.balance, 0) > 0)
    : accounts

  const hiddenCount = accounts.length - visibleAccounts.length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-foreground">Your Accounts</h2>
        {hideToolBar && hiddenCount > 0 && (
          <Link href="/accounts">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        )}
        {
          !hideToolBar && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="accounts-list-hide-zero"
                  checked={hideZeroBalance}
                  onCheckedChange={(checked) => setHideZeroBalance(checked === true)}
                />
                <Label htmlFor="accounts-list-hide-zero" className="text-sm font-normal cursor-pointer">
                  Hide 0 balance
                  {hiddenCount > 0 && hideZeroBalance && (
                    <span className="text-muted-foreground"> ({hiddenCount})</span>
                  )}
                </Label>
              </div>
              <Link href="/accounts">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </Link>
            </div>
          )
        }
      </div>

      {visibleAccounts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          All accounts have a 0 balance. Uncheck &ldquo;Hide 0 balance&rdquo; to see them.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAccounts.map((account) => {
            const Icon = ACCOUNT_TYPE_ICONS[account.type]
            const colorClass = ACCOUNT_TYPE_COLORS[account.type]
            const balance = account.balance

            return (
              <Link key={account.id} href={`/accounts/${account.id}`}>
                <Card className={`p-6 bg-gradient-to-br ${colorClass} hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </p>
                      <h3 className="text-xl font-bold text-foreground mb-2">{account.name}</h3>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(Math.max(balance, 0), account.currency)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
