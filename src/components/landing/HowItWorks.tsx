import { useTranslations } from 'next-intl'

const STEPS = ['step1', 'step2', 'step3'] as const

export default function HowItWorks() {
  const t = useTranslations('landing.howItWorks')

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            {t('sectionSubtitle')}
          </p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {STEPS.map((step, index) => (
            <li key={step} className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold mb-4">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(`${step}.title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`${step}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
