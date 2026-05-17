import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { getTranslations } from 'next-intl/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('auth')
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col gap-6 bg-zinc-900 p-10 text-white">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <blockquote className="space-y-2">
            <p className="text-xl leading-relaxed">&ldquo;{t('tagline')}&rdquo;</p>
            <footer className="text-sm text-zinc-400">Wealth</footer>
          </blockquote>
        </div>
      </div>
      <div className="relative flex flex-col gap-8 items-center justify-center p-8">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageSwitcher variant="compact" />
          <ThemeToggle />
        </div>
        <div className="flex justify-center md:hidden">
          <Logo size="md" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
