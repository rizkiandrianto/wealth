'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FormTheme = 'blue' | 'purple' | 'yellow' | 'emerald'

const THEMES: Record<FormTheme, string> = {
  blue: 'dark:bg-background md:border-l-blue-500 md:bg-blue-50 md:dark:bg-blue-950/30',
  purple: 'dark:bg-background md:border-l-purple-500 md:bg-purple-50 md:dark:bg-purple-950/30',
  yellow: 'dark:bg-background md:border-l-yellow-500 md:bg-yellow-50 md:dark:bg-yellow-950/30',
  emerald: 'dark:bg-background md:border-l-emerald-500 md:bg-emerald-50 md:dark:bg-emerald-950/30',
}

interface FormShellProps {
  title: string
  theme: FormTheme
  onClose?: () => void
  children: React.ReactNode
}

export default function FormShell({ title, theme, onClose, children }: FormShellProps) {
  const tCommon = useTranslations('common')
  return (
    <Card className={cn('border-0 md:border p-4 md:p-6 md:border-l-4', THEMES[theme])}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hidden md:block"
            aria-label={tCommon('close')}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      {children}
    </Card>
  )
}
