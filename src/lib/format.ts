import { useCallback } from 'react'
import { useUIStore } from '@/lib/store/useUIStore'

export const HIDDEN_VALUE_MASK = '••••••'

export function formatCurrency(amount: number, currency: string = 'IDR', hide = false): string {
  if (hide) return HIDDEN_VALUE_MASK
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function useFormatCurrency() {
  const hide = useUIStore((s) => s.hideValues)
  return useCallback(
    (amount: number, currency: string = 'IDR') => formatCurrency(amount, currency, hide),
    [hide]
  )
}

export function useMaskValue() {
  const hide = useUIStore((s) => s.hideValues)
  return useCallback(
    <T,>(value: T, formatted: string): string => (hide ? HIDDEN_VALUE_MASK : formatted),
    [hide]
  )
}

export function formatDate(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
