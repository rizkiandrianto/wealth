'use client'

import { useState } from 'react'
import { Account, Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FormShell from '@/components/FormShell'
import { useAssetStore } from '@/lib/useAssetStore'
import { useFormatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TransactionFormProps {
  accounts: Account[]
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

type TxType = 'transfer' | 'topup' | 'withdrawal'

const TYPE_STYLES: Record<TxType, { active: string; label: string }> = {
  transfer: {
    active: 'bg-blue-100 border-blue-500 text-blue-700',
    label: 'Transfer',
  },
  topup: {
    active: 'bg-green-100 border-green-500 text-green-700',
    label: 'Topup',
  },
  withdrawal: {
    active: 'bg-orange-100 border-orange-500 text-orange-700',
    label: 'Withdrawal',
  },
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
  const [transactionType, setTransactionType] = useState<TxType>('transfer')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fromBalance = fromAccountId ? getAccountBalance(fromAccountId) : null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (transactionType === 'transfer') {
      if (!fromAccountId) newErrors.fromAccountId = 'Akun asal wajib diisi'
      if (!toAccountId) newErrors.toAccountId = 'Akun tujuan wajib diisi'
      if (fromAccountId === toAccountId) {
        newErrors.accountMatch = 'Tidak bisa transfer ke akun yang sama'
      }
    } else if (transactionType === 'topup') {
      if (!toAccountId) newErrors.toAccountId = 'Akun tujuan wajib diisi'
    } else if (transactionType === 'withdrawal') {
      if (!fromAccountId) newErrors.fromAccountId = 'Akun asal wajib diisi'
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0'
    } else if (
      (transactionType === 'transfer' || transactionType === 'withdrawal') &&
      fromAccountId &&
      fromBalance !== null &&
      parseFloat(amount) > fromBalance
    ) {
      newErrors.amount = `Saldo tidak cukup — tersedia: ${formatCurrency(fromBalance)}`
    }

    if (!date) newErrors.date = 'Tanggal wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const selectedDate = new Date(date)
    selectedDate.setHours(12, 0, 0, 0)

    const txData: Omit<Transaction, 'id' | 'createdAt'> = {
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      date: selectedDate.getTime(),
    }

    if (transactionType === 'transfer') {
      txData.fromAccountId = fromAccountId
      txData.toAccountId = toAccountId
    } else if (transactionType === 'topup') {
      txData.toAccountId = toAccountId
    } else if (transactionType === 'withdrawal') {
      txData.fromAccountId = fromAccountId
    }

    onSubmit(txData)

    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setTransactionType('transfer')
    setFromAccountId('')
    setToAccountId('')
  }

  const amountCurrencyAccount =
    transactionType === 'topup'
      ? accounts.find((a) => a.id === toAccountId)
      : accounts.find((a) => a.id === fromAccountId)

  return (
    <FormShell title="Catat Transaksi" theme="emerald" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.accountMatch && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {errors.accountMatch}
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Jenis Transaksi</label>
          <div className="flex gap-2 mt-1">
            {(Object.keys(TYPE_STYLES) as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTransactionType(t)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg border transition-colors',
                  transactionType === t
                    ? TYPE_STYLES[t].active
                    : 'border-border bg-background',
                )}
              >
                {TYPE_STYLES[t].label}
              </button>
            ))}
          </div>
        </div>

        {(transactionType === 'transfer' || transactionType === 'withdrawal') && (
          <div>
            <label className="text-sm font-medium">Dari Akun</label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <label className="text-sm font-medium">Ke Akun</label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.toAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.toAccountId}</p>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Jumlah</label>
          <div className="flex gap-2 mt-1">
            {amountCurrencyAccount && (
              <span className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-medium">
                {amountCurrencyAccount.currency}
              </span>
            )}
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
          <label className="text-sm font-medium">Tanggal</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Keterangan (opsional)</label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="contoh: Transfer bulanan, Setup dana darurat"
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Catat Transaksi
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
