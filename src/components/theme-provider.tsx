'use client'

import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'theme'
export const RESOLVED_THEME_COOKIE = 'theme-resolved'

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function writeResolvedThemeCookie(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  document.cookie = `${RESOLVED_THEME_COOKIE}=${resolved}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.style.colorScheme = resolved
  writeResolvedThemeCookie(resolved)
}

interface ThemeProviderProps {
  children: React.ReactNode
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme())
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => getSystemTheme())

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemTheme(mq.matches ? 'dark' : 'light')
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme

  React.useEffect(() => {
    if (disableTransitionOnChange) {
      const style = document.createElement('style')
      style.appendChild(
        document.createTextNode(
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
        ),
      )
      document.head.appendChild(style)
      applyTheme(resolvedTheme)
      // Force a reflow before removing the override.
      window.getComputedStyle(document.body)
      setTimeout(() => document.head.removeChild(style), 1)
      return
    }
    applyTheme(resolvedTheme)
  }, [resolvedTheme, disableTransitionOnChange])

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = e.newValue
      if (next === 'light' || next === 'dark' || next === 'system') setThemeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: () => {},
    }
  }
  return ctx
}
