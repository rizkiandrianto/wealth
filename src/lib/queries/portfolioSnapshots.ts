import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { num, ts, Row } from '@/lib/normalizers'
import { queryKeys } from './keys'

export interface PortfolioSnapshot {
  date: string
  cashValue: number
  stockValue: number
  cryptoValue: number
  goldValue: number
  totalValue: number
  updatedAt: number
}

const toPortfolioSnapshot = (r: Row): PortfolioSnapshot => ({
  date: r.date,
  cashValue: num(r.cashValue),
  stockValue: num(r.stockValue),
  cryptoValue: num(r.cryptoValue),
  goldValue: num(r.goldValue),
  totalValue: num(r.totalValue),
  updatedAt: ts(r.updatedAt),
})

export const portfolioSnapshotsQueryOptions = () => ({
  queryKey: queryKeys.portfolioSnapshots,
  queryFn: async (): Promise<PortfolioSnapshot[]> => {
    const rows: Row[] = await apiFetch('/api/portfolio-snapshots')
    return rows.map(toPortfolioSnapshot)
  },
})

export function usePortfolioSnapshotsQuery() {
  return useQuery(portfolioSnapshotsQueryOptions())
}
