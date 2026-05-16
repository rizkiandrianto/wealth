import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toSnapshot, SnapshotRow, Row } from '@/lib/normalizers'
import type { SnapshotRange } from '@/lib/snapshot'
import { queryKeys } from './keys'

export type { SnapshotRange } from '@/lib/snapshot'

export const accountSnapshotsQueryOptions = (range: SnapshotRange = '3m') => ({
  queryKey: queryKeys.accountSnapshots.range(range),
  queryFn: async (): Promise<SnapshotRow[]> => {
    const rows: Row[] = await apiFetch(`/api/account-snapshots?range=${range}`)
    return rows.map(toSnapshot)
  },
})

export function useAccountSnapshotsQuery(range: SnapshotRange = '3m') {
  return useQuery(accountSnapshotsQueryOptions(range))
}
