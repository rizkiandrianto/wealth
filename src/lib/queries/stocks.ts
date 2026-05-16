import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toStock, toStockSale, Row } from '@/lib/normalizers'
import { StockHolding, StockSale } from '@/lib/types'
import { queryKeys } from './keys'
import { useGuardedMutation } from './useGuardedMutation'

export const stocksQueryOptions = () => ({
  queryKey: queryKeys.stocks,
  queryFn: async (): Promise<StockHolding[]> => {
    const rows: Row[] = await apiFetch('/api/stocks')
    return rows.map(toStock)
  },
})

export const stockSalesQueryOptions = () => ({
  queryKey: queryKeys.stockSales,
  queryFn: async (): Promise<StockSale[]> => {
    const rows: Row[] = await apiFetch('/api/stocks/sales')
    return rows.map(toStockSale)
  },
})

export type SalesSummary = { totalRealizedPnL: number; count: number }
export type HoldingsSummary = { totalValue: number; totalCost: number; uniqueCount: number }
export type StockTicker = {
  ticker: string
  market: 'IDX' | 'US'
  avgCost: number
  price: number
  currency: string
  changePercentage: number | null
}

export const stockSalesSummaryQueryOptions = () => ({
  queryKey: queryKeys.stockSalesSummary,
  queryFn: async (): Promise<SalesSummary> => {
    return apiFetch('/api/stocks/sales/summary')
  },
})

export const stocksSummaryQueryOptions = () => ({
  queryKey: queryKeys.stocksSummary,
  queryFn: async (): Promise<HoldingsSummary> => {
    return apiFetch('/api/stocks/summary')
  },
})

export const stocksTickersQueryOptions = () => ({
  queryKey: queryKeys.stocksTickers,
  queryFn: async (): Promise<StockTicker[]> => {
    return apiFetch('/api/stocks/tickers')
  },
})

export function useStocksQuery() {
  return useQuery(stocksQueryOptions())
}

export function useStockSalesQuery() {
  return useQuery(stockSalesQueryOptions())
}

export function useStockSalesSummaryQuery() {
  return useQuery(stockSalesSummaryQueryOptions())
}

export function useStocksSummaryQuery() {
  return useQuery(stocksSummaryQueryOptions())
}

export function useStocksTickersQuery() {
  return useQuery(stocksTickersQueryOptions())
}

export function useAddStock() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (input: Omit<StockHolding, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/stocks', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toStock(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
    },
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<StockHolding, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/stocks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toStock(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
    },
  })
}

export function useDeleteStock() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/stocks/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
    },
  })
}

export function useSellStock() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async ({
      stockId,
      quantity,
      salePrice,
    }: {
      stockId: string
      quantity: number
      salePrice: number
    }) => {
      const row = await apiFetch(`/api/stocks/${stockId}/sell`, {
        method: 'POST',
        body: JSON.stringify({ quantity, salePrice }),
      })
      return toStockSale(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
      qc.invalidateQueries({ queryKey: queryKeys.stockSales })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}

export function useSellStockBatch() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (input: {
      ticker: string
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
      }> = await apiFetch('/api/stocks/sell', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return results.map((r) => toStockSale(r.sale))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocks })
      qc.invalidateQueries({ queryKey: queryKeys.stockSales })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}
