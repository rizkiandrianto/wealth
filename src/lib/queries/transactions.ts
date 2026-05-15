import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toTransaction, Row } from '@/lib/normalizers'
import { Transaction } from '@/lib/types'
import { queryKeys } from './keys'

export type TransactionsQueryParams = {
  limit?: number
  accountId?: string
}

export const transactionsQueryOptions = (params: TransactionsQueryParams = {}) => {
  const search = new URLSearchParams()
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.accountId) search.set('accountId', params.accountId)
  const qs = search.toString()
  const url = qs ? `/api/transactions?${qs}` : '/api/transactions'

  return {
    queryKey: [...queryKeys.transactions, params] as const,
    queryFn: async (): Promise<Transaction[]> => {
      const rows: Row[] = await apiFetch(url)
      return rows.map(toTransaction)
    },
  }
}

export function useTransactionsQuery(params: TransactionsQueryParams = {}) {
  return useQuery(transactionsQueryOptions(params))
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Transaction, 'id' | 'createdAt'>) => {
      const row = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toTransaction(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots.all })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots.all })
    },
  })
}
