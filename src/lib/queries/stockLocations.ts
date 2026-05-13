import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toStockLocation, Row } from '@/lib/normalizers'
import { StockLocation } from '@/lib/types'
import { queryKeys } from './keys'

export const stockLocationsQueryOptions = () => ({
  queryKey: queryKeys.stockLocations,
  queryFn: async (): Promise<StockLocation[]> => {
    const rows: Row[] = await apiFetch('/api/stock-locations')
    return rows.map(toStockLocation)
  },
})

export function useStockLocationsQuery() {
  return useQuery(stockLocationsQueryOptions())
}

export function useAddStockLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<StockLocation, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/stock-locations', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toStockLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stockLocations })
    },
  })
}

export function useUpdateStockLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<StockLocation, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/stock-locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toStockLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stockLocations })
    },
  })
}

export function useDeleteStockLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/stock-locations/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stockLocations })
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
    },
  })
}
