import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toCrypto, toCryptoSale, Row } from '@/lib/normalizers'
import { CryptoHolding, CryptoSale } from '@/lib/types'
import { queryKeys } from './keys'

export const cryptosQueryOptions = () => ({
  queryKey: queryKeys.cryptos,
  queryFn: async (): Promise<CryptoHolding[]> => {
    const rows: Row[] = await apiFetch('/api/crypto')
    return rows.map(toCrypto)
  },
})

export const cryptoSalesQueryOptions = () => ({
  queryKey: queryKeys.cryptoSales,
  queryFn: async (): Promise<CryptoSale[]> => {
    const rows: Row[] = await apiFetch('/api/crypto/sales')
    return rows.map(toCryptoSale)
  },
})

export type CryptoSalesSummary = { totalRealizedPnL: number; count: number }
export type CryptosSummary = { totalValue: number; totalCost: number; uniqueCount: number }

export const cryptoSalesSummaryQueryOptions = () => ({
  queryKey: queryKeys.cryptoSalesSummary,
  queryFn: async (): Promise<CryptoSalesSummary> => {
    return apiFetch('/api/crypto/sales/summary')
  },
})

export const cryptosSummaryQueryOptions = () => ({
  queryKey: queryKeys.cryptosSummary,
  queryFn: async (): Promise<CryptosSummary> => {
    return apiFetch('/api/crypto/summary')
  },
})

export function useCryptosQuery() {
  return useQuery(cryptosQueryOptions())
}

export function useCryptoSalesQuery() {
  return useQuery(cryptoSalesQueryOptions())
}

export function useCryptoSalesSummaryQuery() {
  return useQuery(cryptoSalesSummaryQueryOptions())
}

export function useCryptosSummaryQuery() {
  return useQuery(cryptosSummaryQueryOptions())
}

export function useAddCrypto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CryptoHolding, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/crypto', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toCrypto(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
    },
  })
}

export function useUpdateCrypto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<CryptoHolding, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/crypto/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toCrypto(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
    },
  })
}

export function useDeleteCrypto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/crypto/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
    },
  })
}

export function useSellCrypto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      cryptoId,
      quantity,
      salePrice,
    }: {
      cryptoId: string
      quantity: number
      salePrice: number
    }) => {
      const row = await apiFetch(`/api/crypto/${cryptoId}/sell`, {
        method: 'POST',
        body: JSON.stringify({ quantity, salePrice }),
      })
      return toCryptoSale(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
      qc.invalidateQueries({ queryKey: queryKeys.cryptoSales })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}

export function useSellCryptoBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      symbol: string
      locationId: string
      quantity: number
      salePrice: number
      saleDate?: string
    }) => {
      const results: Array<{
        sale: Row
        holdingId: string
        holdingFullyConsumed: boolean
        remainingQty: number
      }> = await apiFetch('/api/crypto/sell', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return results.map((r) => toCryptoSale(r.sale))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cryptos })
      qc.invalidateQueries({ queryKey: queryKeys.cryptoSales })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}
