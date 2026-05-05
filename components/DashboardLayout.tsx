'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Wallet, TrendingUp, Calendar, Menu, X, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const NAVIGATION = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: TrendingUp },
  { href: '/stocks', label: 'Stocks', icon: PieChart },
  { href: '/history', label: 'History', icon: Calendar },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')

  React.useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Asset Tracker</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAVIGATION.map((nav) => {
                const Icon = nav.icon
                const isActive = currentPath === nav.href
                return (
                  <Link key={nav.href} href={nav.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{nav.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1 border-t border-border">
              {NAVIGATION.map((nav) => {
                const Icon = nav.icon
                const isActive = currentPath === nav.href
                return (
                  <Link key={nav.href} href={nav.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{nav.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background">
        <div className="flex items-center justify-around h-16">
          {NAVIGATION.map((nav) => {
            const Icon = nav.icon
            const isActive = currentPath === nav.href
            return (
              <Link key={nav.href} href={nav.href} className="flex-1">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center h-16 text-xs gap-1 transition-colors',
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{nav.label}</span>
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
