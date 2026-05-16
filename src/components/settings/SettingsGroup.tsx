'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AppSettingRow } from '@/lib/queries/settings'
import SettingRow from './SettingRow'

interface SettingsGroupProps {
  prefix: string
  rows: AppSettingRow[]
  defaultOpen?: boolean
}

export default function SettingsGroup({
  prefix,
  rows,
  defaultOpen = true,
}: SettingsGroupProps) {
  const t = useTranslations('settings')
  const [open, setOpen] = useState(defaultOpen)
  const Icon = open ? ChevronDown : ChevronRight

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <Icon className="w-4 h-4" />
        <span className="font-mono">{prefix}.*</span>
        <span className="text-muted-foreground font-sans font-normal">
          {t('groupCount', { count: rows.length })}
        </span>
      </button>
      {open && (
        <div className="space-y-2 pl-2">
          {rows.map((row) => (
            <SettingRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  )
}
