import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toTransaction, Row } from '@/lib/normalizers'
import { Transaction } from '@/lib/types'
import { queryKeys } from './keys'

export const transactionsQueryOptions = () => ({
  queryKey: queryKeys.transactions,
  queryFn: async (): Promise<Transaction[]> => {
    const rows: Row[] = await apiFetch('/api/transactions')
    return rows.map(toTransaction)
  },
})

export function useTransactionsQuery() {
  return useQuery(transactionsQueryOptions())
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
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots })
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
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots })
    },
  })
}
