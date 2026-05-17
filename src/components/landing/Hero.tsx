import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, Github } from 'lucide-react'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'

const GITHUB_URL = 'https://github.com/rizkiandrianto/wealth'

export default function Hero() {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-background to-background dark:from-blue-950/30 dark:via-background dark:to-background"
        aria-hidden
      />
      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <LanguageSwitcher variant="compact" />
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 md:pb-28 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          {t('headline')}
        </h1>
        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t('subheadline')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register">
              {t('ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">{t('ctaSecondary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
