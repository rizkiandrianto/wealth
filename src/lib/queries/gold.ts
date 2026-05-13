import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toGold, toGoldSale, Row } from '@/lib/normalizers'
import { GoldHolding, GoldSale } from '@/lib/types'
import { queryKeys } from './keys'

export const goldsQueryOptions = () => ({
  queryKey: queryKeys.golds,
  queryFn: async (): Promise<GoldHolding[]> => {
    const rows: Row[] = await apiFetch('/api/gold')
    return rows.map(toGold)
  },
})

export const goldSalesQueryOptions = () => ({
  queryKey: queryKeys.goldSales,
  queryFn: async (): Promise<GoldSale[]> => {
    const rows: Row[] = await apiFetch('/api/gold/sales')
    return rows.map(toGoldSale)
  },
})

export type GoldSalesSummary = { totalRealizedPnL: number; count: number }

export const goldSalesSummaryQueryOptions = () => ({
  queryKey: queryKeys.goldSalesSummary,
  queryFn: async (): Promise<GoldSalesSummary> => {
    return apiFetch('/api/gold/sales?aggregate=sum')
  },
})

export function useGoldsQuery() {
  return useQuery(goldsQueryOptions())
}

export function useGoldSalesQuery() {
  return useQuery(goldSalesQueryOptions())
}

export function useGoldSalesSummaryQuery() {
  return useQuery(goldSalesSummaryQueryOptions())
}

export function useAddGold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<GoldHolding, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/gold', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toGold(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.golds })
    },
  })
}

export function useUpdateGold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<GoldHolding, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/gold/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toGold(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.golds })
    },
  })
}

export function useDeleteGold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/gold/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.golds })
    },
  })
}

export function useSellGold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      goldId,
      weight,
      salePrice,
    }: {
      goldId: string
      weight: number
      salePrice: number
    }) => {
      const row = await apiFetch(`/api/gold/${goldId}/sell`, {
        method: 'POST',
        body: JSON.stringify({ weight, salePrice }),
      })
      return toGoldSale(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.golds })
      qc.invalidateQueries({ queryKey: queryKeys.goldSales })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}
