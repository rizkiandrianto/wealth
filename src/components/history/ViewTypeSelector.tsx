'use client'

import { useTranslations } from 'next-intl'

export type ViewType = 'day' | 'month' | 'year'

interface ViewTypeSelectorProps {
  value: ViewType
  onChange: (value: ViewType) => void
  className?: string
}

const LABEL_KEY: Record<ViewType, 'byDay' | 'byMonth' | 'byYear'> = {
  day: 'byDay',
  month: 'byMonth',
  year: 'byYear',
}

export default function ViewTypeSelector({ value, onChange, className }: ViewTypeSelectorProps) {
  const t = useTranslations('history.view')
  return (
    <div className={`flex gap-2 ${className ?? ''}`} role="group">
      {(['day', 'month', 'year'] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={value === type}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            value === type
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t(LABEL_KEY[type])}
        </button>
      ))}
    </div>
  )
}
