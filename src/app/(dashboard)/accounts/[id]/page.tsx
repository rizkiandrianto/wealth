'use client'

// Required APIs:
//   GET    /api/accounts
//   GET    /api/transactions
//   PATCH  /api/accounts/[id]
//   DELETE /api/accounts/[id]

import { useEffect, useMemo, useState, use } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Banknote,
  PiggyBank,
  Wallet,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AccountForm from '@/components/AccountForm'
import { useFormatCurrency, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import { AccountType } from '@/lib/types'
import {
  accountsQueryOptions,
  useAccountsQuery,
  useUpdateAccount,
  useDeleteAccount,
} from '@/lib/queries/accounts'
import { transactionsQueryOptions, useTransactionsQuery } from '@/lib/queries/transactions'

const ACCOUNT_TYPE_ICONS = {
  bank: Banknote,
  deposit: PiggyBank,
  cash: Wallet,
}

const ACCOUNT_TYPE_COLORS = {
  bank: 'from-blue-50 to-blue-100 border-blue-200',
  deposit: 'from-green-50 to-green-100 border-green-200',
  cash: 'from-yellow-50 to-yellow-100 border-yellow-200',
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const formatCurrency = useFormatCurrency()
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions())
    qc.prefetchQuery(transactionsQueryOptions())
  }, [qc])

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery()
  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id])
  const sortedTransactions = useMemo(
    () =>
      account
        ? transactions
            .filter((tx) => tx.fromAccountId === account.id || tx.toAccountId === account.id)
            .sort((a, b) => b.date - a.date)
        : [],
    [account, transactions]
  )

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async (data: {
    name: string
    type: AccountType
    currency: string
  }) => {
    if (!account) return
    setIsSubmitting(true)
    try {
      await updateAccount.mutateAsync({ id: account.id, updates: data })
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!account) return
    setIsSubmitting(true)
    try {
      await deleteAccount.mutateAsync(account.id)
      setShowDeleteDialog(false)
      router.push('/accounts')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Accounts
          </Link>
          <Card className="p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">Account not found</h3>
            <p className="text-muted-foreground mb-6">
              The account you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Link href="/accounts">
              <Button>Back to Accounts</Button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const Icon = ACCOUNT_TYPE_ICONS[account.type]
  const colorClass = ACCOUNT_TYPE_COLORS[account.type]
  const balance = account.balance

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts
        </Link>

        <Card className={`p-6 bg-gradient-to-br ${colorClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-foreground" />
                <p className="text-sm font-medium text-muted-foreground capitalize">
                  {account.type}
                </p>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{account.name}</h1>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(Math.max(balance, 0), account.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Currency: {account.currency}
              </p>
            </div>

            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </Card>

        {isEditing && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Account</h2>
            <AccountForm
              initialData={{
                name: account.name,
                type: account.type,
                currency: account.currency,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
            {isSubmitting && (
              <p className="text-sm text-muted-foreground mt-3">Saving…</p>
            )}
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
          {txLoading ? (
            <Card className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </Card>
          ) : sortedTransactions.length === 0 ? (
            <Card className="p-8 text-center">
              <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No transactions for this account yet</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-border">
                {sortedTransactions.map((tx) => {
                  const isIncoming = tx.toAccountId === account.id
                  const counterpartId = isIncoming ? tx.fromAccountId : tx.toAccountId
                  let counterpartName: string;
                  if (counterpartId) {
                    counterpartName = accounts.find((a) => a.id === counterpartId)?.name ?? 'Unknown';
                  } else {
                    counterpartName = isIncoming ? 'Topup' : 'Withdrawal';
                  }

                  const isTopupOrWithdrawal = counterpartName === 'Topup' || counterpartName === 'Withdrawal';

                  const amountColor = isIncoming ? 'text-green-600' : 'text-orange-600'
                  const amountPrefix = isIncoming ? '+' : '-';
                  const label = isIncoming
                    ? `From ${counterpartName}`
                    : `To ${counterpartName}`;
                  const finalLabel = isTopupOrWithdrawal ? counterpartName : label;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{finalLabel}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(tx.date)}
                          {tx.description && ` • ${tx.description}`}
                        </p>
                      </div>
                      <p className={`text-lg font-bold ${amountColor}`}>
                        {amountPrefix}
                        {formatCurrency(tx.amount, account.currency)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete ${account.name}?`}
        description="This will permanently delete this account and all of its transactions. This action cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        isLoading={isSubmitting}
        destructive
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  )
}
