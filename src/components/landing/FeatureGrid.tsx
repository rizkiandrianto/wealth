import { useTranslations } from 'next-intl'
import FeatureCard from '@/components/landing/FeatureCard'
import { LANDING_FEATURES } from '@/lib/landingFeatures'

export default function FeatureGrid() {
  const t = useTranslations('landing')

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('features.sectionTitle')}
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            {t('features.sectionSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {LANDING_FEATURES.map((feature) => (
            <FeatureCard key={feature.key} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
