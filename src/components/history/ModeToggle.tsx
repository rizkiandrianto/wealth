'use client'

interface ModeOption<T extends string> {
  value: T
  label: string
}

interface ModeToggleProps<T extends string> {
  options: ReadonlyArray<ModeOption<T>>
  value: T
  onChange: (value: T) => void
  className?: string
}

export default function ModeToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: ModeToggleProps<T>) {
  return (
    <div
      className={`inline-flex gap-1 p-1 bg-muted rounded-lg ${className ?? ''}`}
      role="group"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              active
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
