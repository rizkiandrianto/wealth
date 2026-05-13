import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toGoldLocation, Row } from '@/lib/normalizers'
import { GoldLocation } from '@/lib/types'
import { queryKeys } from './keys'

export const goldLocationsQueryOptions = () => ({
  queryKey: queryKeys.goldLocations,
  queryFn: async (): Promise<GoldLocation[]> => {
    const rows: Row[] = await apiFetch('/api/gold-locations')
    return rows.map(toGoldLocation)
  },
})

export function useGoldLocationsQuery() {
  return useQuery(goldLocationsQueryOptions())
}

export function useAddGoldLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<GoldLocation, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/gold-locations', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toGoldLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goldLocations })
    },
  })
}

export function useUpdateGoldLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<GoldLocation, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/gold-locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toGoldLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goldLocations })
    },
  })
}

export function useDeleteGoldLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/gold-locations/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goldLocations })
      qc.invalidateQueries({ queryKey: queryKeys.golds })
    },
  })
}
