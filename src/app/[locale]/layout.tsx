import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { Providers } from './providers'
import { ThemeProvider, RESOLVED_THEME_COOKIE } from '@/components/theme-provider'
import { routing } from '@/i18n/routing'
import '../globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wealth',
  description: 'Track your assets across different accounts - bank, deposit, and more',
  icons: {
    icon: '/mywealth.png',
    apple: '/mywealth.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const cookieStore = await cookies()
  const resolvedCookie = cookieStore.get(RESOLVED_THEME_COOKIE)?.value || 'dark'
  const resolvedTheme = resolvedCookie === 'light' ? 'light' : 'dark'

  return (
    <html
      lang={locale}
      className={`${resolvedTheme} bg-background ${geist.className}`}
      style={{ colorScheme: resolvedTheme }}
      suppressHydrationWarning
    >
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider disableTransitionOnChange>
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
