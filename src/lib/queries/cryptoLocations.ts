import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toCryptoLocation, Row } from '@/lib/normalizers'
import { CryptoLocation } from '@/lib/types'
import { queryKeys } from './keys'

export const cryptoLocationsQueryOptions = () => ({
  queryKey: queryKeys.cryptoLocations,
  queryFn: async (): Promise<CryptoLocation[]> => {
    const rows: Row[] = await apiFetch('/api/crypto-locations')
    return rows.map(toCryptoLocation)
  },
})

export function useCryptoLocationsQuery() {
  return useQuery(cryptoLocationsQueryOptions())
}

export function useAddCryptoLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CryptoLocation, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/crypto-locations', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toCryptoLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptoLocations })
    },
  })
}

export function useUpdateCryptoLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<CryptoLocation, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/crypto-locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toCryptoLocation(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptoLocations })
    },
  })
}

export function useDeleteCryptoLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/crypto-locations/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptoLocations })
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
    },
  })
}
