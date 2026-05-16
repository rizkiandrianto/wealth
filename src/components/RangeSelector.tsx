'use client'

import { useTranslations } from 'next-intl'
import type { SnapshotRange } from '@/lib/snapshot'

const PRESETS: ReadonlyArray<{ value: SnapshotRange; label: string }> = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All' },
]

interface RangeSelectorProps {
  value: SnapshotRange
  onChange: (range: SnapshotRange) => void
  className?: string
}

export default function RangeSelector({ value, onChange, className }: RangeSelectorProps) {
  const t = useTranslations('history.range')
  return (
    <div
      className={`inline-flex gap-1 p-1 bg-muted rounded-lg ${className ?? ''}`}
      role="group"
      aria-label={t('label')}
    >
      {PRESETS.map((p) => {
        const active = p.value === value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            aria-pressed={active}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              active
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
