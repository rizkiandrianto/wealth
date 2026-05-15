'use client'

export type ViewType = 'day' | 'month' | 'year'

interface ViewTypeSelectorProps {
  value: ViewType
  onChange: (value: ViewType) => void
  className?: string
}

export default function ViewTypeSelector({ value, onChange, className }: ViewTypeSelectorProps) {
  return (
    <div className={`flex gap-2 ${className ?? ''}`} role="group" aria-label="View type">
      {(['day', 'month', 'year'] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={value === type}
          className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
            value === type
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          By {type}
        </button>
      ))}
    </div>
  )
}
