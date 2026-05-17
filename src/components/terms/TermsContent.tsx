'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Clock, Database, Shield } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const LAST_UPDATED_ISO = '2026-05-17'

const PRIVACY_POINTS = ['noSelling', 'noAds', 'ownership', 'purpose', 'deletion'] as const
const RESPONSIBILITY_POINTS = ['accuracy', 'decisions', 'credentials', 'lawfulUse'] as const
const SCHEDULE_ITEMS = [
  { key: 'prices', Icon: Clock },
  { key: 'goldAndSnapshot', Icon: Database },
  { key: 'accountSnapshot', Icon: Database },
] as const

interface TermsContentProps {
  showHeading?: boolean
}

export default function TermsContent({ showHeading = true }: TermsContentProps) {
  const t = useTranslations('landing.terms')
  const locale = useLocale() as Locale
  const formattedDate = new Date(LAST_UPDATED_ISO).toLocaleDateString(
    locale === 'id' ? 'id-ID' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )

  return (
    <div className="space-y-10 leading-relaxed">
      {showHeading && (
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-base text-muted-foreground">{t('subtitle')}</p>
          <p className="text-xs text-muted-foreground">
            {t('lastUpdated', { date: formattedDate })}
          </p>
        </div>
      )}

      <article className="space-y-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('intro.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('intro.body')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t('privacy.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('privacy.intro')}</p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5 marker:text-primary">
            {PRIVACY_POINTS.map((point) => (
              <li key={point}>{t(`privacy.points.${point}`)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('security.title')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('security.intro')}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h3 className="text-sm font-semibold">{t('security.supabase.title')}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('security.supabase.body')}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h3 className="text-sm font-semibold">{t('security.vercel.title')}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('security.vercel.body')}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">{t('security.responsibility')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t('howItWorks.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('howItWorks.intro')}</p>
          <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold">{t('howItWorks.schedule.title')}</h3>
            <ol className="space-y-4">
              {SCHEDULE_ITEMS.map(({ key, Icon }) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t(`howItWorks.schedule.${key}.title`)}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(`howItWorks.schedule.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted-foreground italic">{t('howItWorks.delays')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('userResponsibility.title')}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5 marker:text-primary">
            {RESPONSIBILITY_POINTS.map((point) => (
              <li key={point}>{t(`userResponsibility.points.${point}`)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('service.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('service.body')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('changes.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('changes.body')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('contact.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('contact.body')}</p>
        </section>
      </article>
    </div>
  )
}
