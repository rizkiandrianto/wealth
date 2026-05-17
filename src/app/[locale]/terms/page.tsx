// Required APIs:
//   (none — static legal page)

import Link from 'next/link'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import LandingFooter from '@/components/landing/LandingFooter'
import TermsContent from '@/components/terms/TermsContent'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing.terms' })
  return {
    title: `${t('title')} • Wealth`,
    description: t('subtitle'),
  }
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'landing.terms' })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="compact" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        <TermsContent />
      </main>

      <LandingFooter />
    </div>
  )
}
