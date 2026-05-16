import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useUIStore } from '@/lib/store/useUIStore'

export const HIDDEN_VALUE_MASK = '••••••'

const LOCALE_TAG: Record<string, string> = {
  id: 'id-ID',
  en: 'en-US',
}

function resolveLocaleTag(locale: string | undefined): string {
  return LOCALE_TAG[locale ?? 'id'] ?? 'id-ID'
}

export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  hide = false,
  locale: string = 'id-ID',
): string {
  if (hide) return HIDDEN_VALUE_MASK
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function useFormatCurrency() {
  const hide = useUIStore((s) => s.hideValues)
  const locale = useLocale()
  const localeTag = resolveLocaleTag(locale)
  return useCallback(
    (amount: number, currency: string = 'IDR') => formatCurrency(amount, currency, hide, localeTag),
    [hide, localeTag],
  )
}

export function useMaskValue() {
  const hide = useUIStore((s) => s.hideValues)
  return useCallback(
    <T,>(value: T, formatted: string): string => (hide ? HIDDEN_VALUE_MASK : formatted),
    [hide]
  )
}

export function formatDate(timestamp: number | string, locale: string = 'id-ID'): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(timestamp: number, locale: string = 'id-ID'): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function useFormatDate() {
  const locale = useLocale()
  const localeTag = resolveLocaleTag(locale)
  return useCallback(
    (timestamp: number | string) => formatDate(timestamp, localeTag),
    [localeTag],
  )
}

export function useFormatDateTime() {
  const locale = useLocale()
  const localeTag = resolveLocaleTag(locale)
  return useCallback(
    (timestamp: number) => formatDateTime(timestamp, localeTag),
    [localeTag],
  )
}

export function formatDateShort(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}`
}

export function formatMonth(date: string): string {
  const [year, month] = date.split('-')
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${monthNames[parseInt(month) - 1]} ${year}`
}

export function getMonthFromDate(date: string): string {
  return date.substring(0, 7)
}

export function getYearFromDate(date: string): string {
  return date.substring(0, 4)
}
