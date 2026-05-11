'use client'

import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FormTheme = 'blue' | 'purple' | 'yellow' | 'emerald'

const THEMES: Record<FormTheme, string> = {
  blue: 'border-l-blue-500 bg-blue-50',
  purple: 'border-l-purple-500 bg-purple-50',
  yellow: 'border-l-yellow-500 bg-yellow-50',
  emerald: 'border-l-emerald-500 bg-emerald-50',
}

interface FormShellProps {
  title: string
  theme: FormTheme
  onClose?: () => void
  children: React.ReactNode
}

export default function FormShell({ title, theme, onClose, children }: FormShellProps) {
  return (
    <Card className={cn('p-6 border-l-4', THEMES[theme])}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      {children}
    </Card>
  )
}
