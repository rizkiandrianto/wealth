import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'

export default function LandingFooter() {
  const t = useTranslations('landing.footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground max-w-md">{t('tagline')}</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('loginLink')}
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('registerLink')}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="compact" />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-muted-foreground text-center md:text-left">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  )
}
