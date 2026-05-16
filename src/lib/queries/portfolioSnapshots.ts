import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { num, ts, Row } from '@/lib/normalizers'
import type { SnapshotRange } from '@/lib/snapshot'
import { queryKeys } from './keys'

export type { SnapshotRange } from '@/lib/snapshot'

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

export const portfolioSnapshotsQueryOptions = (range: SnapshotRange = '3m') => ({
  queryKey: queryKeys.portfolioSnapshots.range(range),
  queryFn: async (): Promise<PortfolioSnapshot[]> => {
    const rows: Row[] = await apiFetch(`/api/portfolio-snapshots?range=${range}`)
    return rows.map(toPortfolioSnapshot)
  },
})

export function usePortfolioSnapshotsQuery(range: SnapshotRange = '3m') {
  return useQuery(portfolioSnapshotsQueryOptions(range))
}
