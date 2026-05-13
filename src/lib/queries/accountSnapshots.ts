import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toSnapshot, SnapshotRow, Row } from '@/lib/normalizers'
import { queryKeys } from './keys'

export const accountSnapshotsQueryOptions = () => ({
  queryKey: queryKeys.accountSnapshots,
  queryFn: async (): Promise<SnapshotRow[]> => {
    const rows: Row[] = await apiFetch('/api/account-snapshots')
    return rows.map(toSnapshot)
  },
})

export function useAccountSnapshotsQuery() {
  return useQuery(accountSnapshotsQueryOptions())
}
