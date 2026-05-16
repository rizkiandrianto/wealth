'use client'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { locales, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

const LANGUAGE_LABELS: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

const LANGUAGE_SHORT: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
}

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'pill'
}

function setLocaleCookie(next: Locale) {
  document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

function PillToggle() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = useTranslations('nav')

  const handleSelect = (next: Locale) => {
    if (next === locale) return
    setLocaleCookie(next)
    router.refresh()
  }

  return (
    <div
      className="inline-flex gap-1 p-1 bg-muted rounded-md w-fit"
      role="group"
      aria-label={t('language')}
    >
      {locales.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => handleSelect(l)}
            aria-pressed={active}
            className={cn(
              'px-2 py-0.5 text-xs rounded-sm transition-colors',
              active
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {LANGUAGE_SHORT[l]}
          </button>
        )
      })}
    </div>
  )
}

export default function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = useTranslations('nav')

  if (variant === 'pill') {
    return <PillToggle />
  }

  const handleSelect = (next: Locale) => {
    if (next === locale) return
    setLocaleCookie(next)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label={t('language')}>
          <Languages className="w-4 h-4" />
          <span>{variant === 'compact' ? LANGUAGE_SHORT[locale] : LANGUAGE_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleSelect(l)}
            className={l === locale ? 'font-semibold' : ''}
          >
            {LANGUAGE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
