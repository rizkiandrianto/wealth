// Required APIs:
//   (none — static landing)

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Hero from '@/components/landing/Hero'
import HeroScreenshot from '@/components/landing/HeroScreenshot'
import FeatureGrid from '@/components/landing/FeatureGrid'
import HowItWorks from '@/components/landing/HowItWorks'
import CTASection from '@/components/landing/CTASection'
import LandingFooter from '@/components/landing/LandingFooter'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Hero />
      <HeroScreenshot />
      <FeatureGrid />
      <HowItWorks />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
