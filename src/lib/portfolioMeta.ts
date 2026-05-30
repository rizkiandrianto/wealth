import type { PortfolioKey } from '@/lib/store/useUIStore'

export const PORTFOLIO_COLORS: Record<PortfolioKey, string> = {
  cash: '#a855f7',
  stock: '#3b82f6',
  crypto: '#f97316',
  gold: '#eab308',
}

export type PortfolioSlice = {
  key: PortfolioKey
  labelKey: 'cash' | 'stocks' | 'crypto' | 'gold'
  value: number
}
