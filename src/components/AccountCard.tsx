'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Account } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { Banknote, PiggyBank, Wallet, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog'

interface AccountCardProps {
  account: Account
  balance: number
  onDelete: (id: string) => void | Promise<void>
}

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

export default function AccountCard({
  account,
  balance,
  onDelete,
}: AccountCardProps) {
  const Icon = ACCOUNT_TYPE_ICONS[account.type]
  const colorClass = ACCOUNT_TYPE_COLORS[account.type]
  const formatCurrency = useFormatCurrency()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(account.id)
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className={`p-0 bg-gradient-to-br ${colorClass} relative overflow-hidden group hover:shadow-md transition-shadow`}>
        <Link href={`/accounts/${account.id}`} className="block p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-foreground" />
                <p className="text-sm font-medium text-muted-foreground capitalize">
                  {account.type}
                </p>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{account.name}</h3>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(Math.max(balance, 0), account.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Currency: {account.currency}</p>
            </div>
          </div>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete ${account.name}?`}
        description="This will permanently delete this account and all of its transactions. This action cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        isLoading={isDeleting}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
