'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme-provider'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Calendar,
  Menu,
  X,
  PieChart,
  Gem,
  ChevronDown,
  LogOut,
  Moon,
  Languages,
  User,
  Bitcoin,
  ArrowLeftRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const FINANCE_ITEMS = [
  { href: '/accounts', labelKey: 'accounts', icon: Wallet },
  { href: '/transactions', labelKey: 'transactions', icon: ArrowLeftRight },
] as const

const PORTFOLIO_ITEMS = [
  { href: '/stocks', labelKey: 'stocks', icon: TrendingUp },
  { href: '/crypto', labelKey: 'crypto', icon: Bitcoin },
  { href: '/gold', labelKey: 'gold', icon: Gem },
] as const

// Bottom nav: 4 items — Finance goes to /accounts, Portfolio goes to /stocks
const BOTTOM_NAV = [
  { href: '/', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/crypto', labelKey: 'crypto', icon: Bitcoin },
  { href: '/stocks', labelKey: 'stocks', icon: TrendingUp },
  { href: '/history', labelKey: 'history', icon: Calendar },
] as const

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const t = useTranslations('nav')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const currentPath = usePathname()
  const { data: session } = useSession()
  const userName = session?.user?.name ?? session?.user?.email ?? 'User'
  const { resolvedTheme, setTheme } = useTheme()
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const isFinanceActive = FINANCE_ITEMS.some((i) => i.href === currentPath)
  const isPortfolioActive = PORTFOLIO_ITEMS.some((i) => i.href === currentPath)

  // Bottom nav active: Finance tab is active on /accounts or /transactions
  const getBottomActive = (href: string) => {
    if (href === '/crypto') return currentPath === '/crypto'
    if (href === '/stocks') return currentPath === '/stocks'
    return currentPath === href
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Dashboard */}
              <Link href="/">
                <Button variant={currentPath === '/' ? 'default' : 'ghost'} size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('dashboard')}</span>
                </Button>
              </Link>

              {/* Finance dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={isFinanceActive ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <Wallet className="w-4 h-4" />
                    <span>{t('finance')}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {FINANCE_ITEMS.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4" />
                          {t(item.labelKey)}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Portfolio dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={isPortfolioActive ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <PieChart className="w-4 h-4" />
                    <span>{t('portfolio')}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {PORTFOLIO_ITEMS.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4" />
                          {t(item.labelKey)}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* History */}
              <Link href="/history">
                <Button variant={currentPath === '/history' ? 'default' : 'ghost'} size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('history')}</span>
                </Button>
              </Link>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 ml-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{userName}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground truncate max-w-[200px]">
                    {session?.user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                    <Languages className="w-4 h-4" />
                    <span className="flex-1">{t('language')}</span>
                    <LanguageSwitcher variant="pill" />
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                    <Moon className="w-4 h-4" />
                    <span className="flex-1">{t('darkMode')}</span>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      aria-label={t('darkMode')}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Hamburger Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1 border-t border-border pt-2">
              <Link href="/">
                <Button
                  variant={currentPath === '/' ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {t('dashboard')}
                </Button>
              </Link>
              <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('finance')}
              </div>
              {FINANCE_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={currentPath === item.href ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.labelKey)}
                    </Button>
                  </Link>
                )
              })}
              <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('portfolio')}
              </div>
              {PORTFOLIO_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={currentPath === item.href ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.labelKey)}
                    </Button>
                  </Link>
                )
              })}
              <Link href="/history">
                <Button
                  variant={currentPath === '/history' ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="w-5 h-5" />
                  {t('history')}
                </Button>
              </Link>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Languages className="w-5 h-5" />
                  <span className="flex-1">{t('language')}</span>
                  <LanguageSwitcher variant="pill" />
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Moon className="w-5 h-5" />
                  <span className="flex-1">{t('darkMode')}</span>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label={t('darkMode')}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="w-5 h-5" />
                  {t('logout')} ({userName})
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation — 4 items */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background rounded-t-3xl">
        <div className="flex items-center justify-around h-16">
          {BOTTOM_NAV.map((nav) => {
            const Icon = nav.icon
            const isActive = getBottomActive(nav.href)
            return (
              <Link key={nav.href} href={nav.href} className="flex-1">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center h-16 text-xs gap-1 transition-colors',
                    isActive ? 'text-blue-600 font-semibold dark:text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{t(nav.labelKey)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Content Padding */}
      <div className="md:hidden h-16" />
    </div>
  )
}
