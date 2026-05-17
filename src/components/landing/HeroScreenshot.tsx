import { useTranslations, useLocale, Locale } from 'next-intl'

/**
 * Hero product shot. Drop a screenshot at `public/landing-dashboard.png`
 * (recommended ratio ~16:10, e.g. 1600×1000) and it appears here.
 * Until then the placeholder below is shown.
 */
const SCREENSHOT_PATH = '/landing-dashboard'

export default function HeroScreenshot() {
  const t = useTranslations('landing.screenshot');
  const locale = useLocale() as Locale

  return (
    <section className="px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-16 pb-8 md:pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-xl border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Browser-frame top bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" aria-hidden />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" aria-hidden />
            <div className="ml-3 flex-1 max-w-xs rounded-md bg-background/60 border px-3 py-1 text-xs text-muted-foreground truncate">
              mywealth.rizkiandrianto.com/dashboard
            </div>
          </div>

          {/* Screenshot slot — uses background-image so a missing file falls
              back silently to the gradient + caption (no broken-image icon). */}
          <div
            role="img"
            aria-label={t('alt')}
            className="relative aspect-16/10 bg-linear-to-br from-muted/30 via-background to-muted/40 bg-cover bg-top bg-no-repeat"
            style={{ backgroundImage: `url(${SCREENSHOT_PATH}-${locale}.png)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-muted-foreground/70 italic mix-blend-difference">
                {t('placeholder')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
