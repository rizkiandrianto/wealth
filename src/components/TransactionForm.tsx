'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { useFormatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TransactionFormProps {
  accounts: Account[]
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

type TxType = 'transfer' | 'topup' | 'withdrawal'

const TYPE_STYLES: Record<TxType, { active: string }> = {
  transfer: {
    active: 'bg-blue-100 border-blue-500 text-blue-700',
  },
  topup: {
    active: 'bg-green-100 border-green-500 text-green-700',
  },
  withdrawal: {
    active: 'bg-orange-100 border-orange-500 text-orange-700',
  },
}

export default function TransactionForm({
  accounts,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const tError = useTranslations('errors')
  const formatCurrency = useFormatCurrency()
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [transactionType, setTransactionType] = useState<TxType>('transfer')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fromBalance = fromAccountId
    ? accounts.find((a) => a.id === fromAccountId)?.balance ?? 0
    : null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (transactionType === 'transfer') {
      if (!fromAccountId) newErrors.fromAccountId = t('fromAccountRequired')
      if (!toAccountId) newErrors.toAccountId = t('toAccountRequired')
      if (fromAccountId === toAccountId) {
        newErrors.accountMatch = t('sameAccount')
      }
    } else if (transactionType === 'topup') {
      if (!toAccountId) newErrors.toAccountId = t('toAccountRequired')
    } else if (transactionType === 'withdrawal') {
      if (!fromAccountId) newErrors.fromAccountId = t('fromAccountRequired')
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t('amountPositive')
    } else if (
      (transactionType === 'transfer' || transactionType === 'withdrawal') &&
      fromAccountId &&
      fromBalance !== null &&
      parseFloat(amount) > fromBalance
    ) {
      newErrors.amount = tError('insufficientBalance', { available: formatCurrency(fromBalance) })
    }

    if (!date) newErrors.date = t('dateRequired')

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
    <FormShell title={t('recordTransaction')} theme="emerald" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.accountMatch && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {errors.accountMatch}
          </div>
        )}

        <div>
          <label className="text-sm font-medium">{t('transactionType')}</label>
          <div className="flex gap-2 mt-1">
            {(Object.keys(TYPE_STYLES) as TxType[]).map((typeKey) => (
              <button
                key={typeKey}
                type="button"
                onClick={() => setTransactionType(typeKey)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg border transition-colors',
                  transactionType === typeKey
                    ? TYPE_STYLES[typeKey].active
                    : 'border-border bg-background',
                )}
              >
                {t(typeKey)}
              </button>
            ))}
          </div>
        </div>

        {(transactionType === 'transfer' || transactionType === 'withdrawal') && (
          <div>
            <label className="text-sm font-medium">{t('fromAccount')}</label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder={t('selectAccount')} />
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
                {t('availableBalance')}: {formatCurrency(fromBalance)}
              </p>
            )}
            {errors.fromAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.fromAccountId}</p>
            )}
          </div>
        )}

        {(transactionType === 'transfer' || transactionType === 'topup') && (
          <div>
            <label className="text-sm font-medium">{t('toAccount')}</label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder={t('selectAccount')} />
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
          <label className="text-sm font-medium">{t('amount')}</label>
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
          <label className="text-sm font-medium">{t('date')}</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">{t('descriptionOptional')}</label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            className="mt-1"
          />
        </div>

        <div className="md:flex gap-2 md:justify-end grid grid-cols-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {t('recordTransaction')}
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
