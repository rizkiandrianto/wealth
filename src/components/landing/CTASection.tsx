import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  const t = useTranslations('landing.cta')

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-12 md:px-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          {t('subtitle')}
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/register">
              {t('button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
