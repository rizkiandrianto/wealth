'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AccountType } from '@/lib/types'

interface AccountFormProps {
  onSubmit: (data: { name: string; type: AccountType; currency: string }) => void
  onCancel: () => void
  initialData?: {
    name: string
    type: AccountType
    currency: string
  }
}

const ACCOUNT_TYPE_VALUES: AccountType[] = ['bank', 'deposit', 'cash']

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD']

export default function AccountForm({
  onSubmit,
  onCancel,
  initialData,
}: AccountFormProps) {
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  const [name, setName] = useState(initialData?.name || '')
  const [type, setType] = useState<AccountType>(initialData?.type || 'bank')
  const [currency, setCurrency] = useState(initialData?.currency || 'IDR')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = t('nameRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      name: name.trim(),
      type,
      currency,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('name')}</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className="w-full"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACCOUNT_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`accountType.${v}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('currency')}</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          {initialData ? t('updateAccount') : t('addAccount')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {tCommon('cancel')}
        </Button>
      </div>
    </form>
  )
}
