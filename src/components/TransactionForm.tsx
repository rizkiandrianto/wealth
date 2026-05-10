'use client'

import { useState } from 'react'
import { Account, Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAssetStore } from '@/lib/useAssetStore'
import { useFormatCurrency } from '@/lib/format'

interface TransactionFormProps {
  accounts: Account[]
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

export default function TransactionForm({
  accounts,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const { getAccountBalance } = useAssetStore()
  const formatCurrency = useFormatCurrency()
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [transactionType, setTransactionType] = useState<'transfer' | 'topup' | 'withdrawal'>('transfer')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fromBalance = fromAccountId ? getAccountBalance(fromAccountId) : null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (transactionType === 'transfer') {
      if (!fromAccountId) {
        newErrors.fromAccountId = 'From account is required'
      }
      if (!toAccountId) {
        newErrors.toAccountId = 'To account is required'
      }
      if (fromAccountId === toAccountId) {
        newErrors.accountMatch = 'Cannot transfer to the same account'
      }
    } else if (transactionType === 'topup') {
      if (!toAccountId) {
        newErrors.toAccountId = 'To account is required'
      }
    } else if (transactionType === 'withdrawal') {
      if (!fromAccountId) {
        newErrors.fromAccountId = 'From account is required'
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    } else if (
      (transactionType === 'transfer' || transactionType === 'withdrawal') &&
      fromAccountId &&
      fromBalance !== null &&
      parseFloat(amount) > fromBalance
    ) {
      newErrors.amount = `Saldo tidak cukup — tersedia: ${formatCurrency(fromBalance)}`
    }

    if (!date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const selectedDate = new Date(date)
    selectedDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues

    const txData: any = {
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      date: selectedDate.getTime(),
    }

    if (transactionType === 'transfer') {
      txData.fromAccountId = fromAccountId
      txData.toAccountId = toAccountId
    } else if (transactionType === 'topup') {
      txData.toAccountId = toAccountId
      // fromAccountId is undefined
    } else if (transactionType === 'withdrawal') {
      txData.fromAccountId = fromAccountId
      // toAccountId is undefined
    }

    onSubmit(txData)

    // Reset form
    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setTransactionType('transfer')
    setFromAccountId('')
    setToAccountId('')
  }

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {errors.accountMatch && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {errors.accountMatch}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Jenis Transaksi</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTransactionType('transfer')}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              transactionType === 'transfer'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'border-border bg-background'
            }`}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('topup')}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              transactionType === 'topup'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'border-border bg-background'
            }`}
          >
            Topup
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('withdrawal')}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              transactionType === 'withdrawal'
                ? 'bg-orange-100 border-orange-500 text-orange-700'
                : 'border-border bg-background'
            }`}
          >
            Withdrawal
          </button>
        </div>
      </div>

      {(transactionType === 'transfer' || transactionType === 'withdrawal') && (
        <div>
          <label className="block text-sm font-medium mb-2">From Account</label>
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {fromBalance !== null && (
            <p className="text-muted-foreground text-sm mt-1">
              Saldo tersedia: {formatCurrency(fromBalance)}
            </p>
          )}
          {errors.fromAccountId && (
            <p className="text-red-500 text-sm mt-1">{errors.fromAccountId}</p>
          )}
        </div>
      )}

      {(transactionType === 'transfer' || transactionType === 'topup') && (
        <div>
          <label className="block text-sm font-medium mb-2">To Account</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.toAccountId && (
            <p className="text-red-500 text-sm mt-1">{errors.toAccountId}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <div className="flex gap-2">
          {(() => {
            const relevantAccount = transactionType === 'topup' 
              ? accounts.find((a) => a.id === toAccountId)
              : accounts.find((a) => a.id === fromAccountId)
            return relevantAccount ? (
              <span className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-medium">
                {relevantAccount.currency}
              </span>
            ) : null
          })()}
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1"
          />
        </div>
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full"
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description (optional)</label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Monthly transfer, Emergency fund setup"
          className="w-full"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          Record Transaction
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
