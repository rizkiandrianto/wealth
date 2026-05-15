'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { Wallet, ChevronRight, Plus } from 'lucide-react'
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_COLORS } from '@/lib/accountTypeMeta'

interface AccountsListProps {
  defaultHideZeroBalance?: boolean;
  hideToolBar?: boolean;
}

export default function AccountsList({
  defaultHideZeroBalance = true,
  hideToolBar = false,
}: AccountsListProps) {
  const t = useTranslations('accounts')
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
          <h3 className="text-lg font-semibold mb-2">{t('noAccounts')}</h3>
          <p className="text-muted-foreground mb-6">{t('noAccountsHint')}</p>
          <Link href="/accounts">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addAccount')}
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
        <h2 className="text-2xl font-bold text-foreground">{t('yourAccounts')}</h2>
        {hideToolBar && hiddenCount > 0 && (
          <Link href="/accounts">
            <Button variant="outline" size="sm">
              {t('viewAll')}
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
                  {t('hideZeroBalance')}
                  {hiddenCount > 0 && hideZeroBalance && (
                    <span className="text-muted-foreground"> ({hiddenCount})</span>
                  )}
                </Label>
              </div>
              <Link href="/accounts">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addAccount')}
                </Button>
              </Link>
            </div>
          )
        }
      </div>

      {visibleAccounts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t('allZeroBalance', { label: t('hideZeroBalance') })}
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
