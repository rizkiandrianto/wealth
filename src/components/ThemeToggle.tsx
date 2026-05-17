'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('nav')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'
  const Icon = isDark ? Sun : Moon

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={t('darkMode')}
    >
      <Icon className="w-4 h-4" />
    </Button>
  )
}
