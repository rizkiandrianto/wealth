import { useTranslations } from 'next-intl'
import type { LandingFeature } from '@/lib/landingFeatures'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  feature: LandingFeature
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const t = useTranslations('landing')
  const Icon = feature.icon

  return (
    <Card className="gap-4 py-6 px-6 hover:shadow-md transition-shadow">
      <div
        className={cn(
          'w-11 h-11 rounded-lg bg-muted flex items-center justify-center',
          feature.accentColor,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-tight">{t(feature.titleKey)}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(feature.descriptionKey)}
        </p>
      </div>
    </Card>
  )
}
