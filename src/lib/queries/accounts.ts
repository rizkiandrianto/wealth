import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toAccount, Row } from '@/lib/normalizers'
import { Account } from '@/lib/types'
import { queryKeys } from './keys'

export const accountsQueryOptions = () => ({
  queryKey: queryKeys.accounts,
  queryFn: async (): Promise<Account[]> => {
    const rows: Row[] = await apiFetch('/api/accounts')
    return rows.map(toAccount)
  },
})

export function useAccountsQuery() {
  return useQuery(accountsQueryOptions())
}

export function useAddAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Account, 'id' | 'createdAt' | 'balance'>) => {
      const row = await apiFetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return toAccount(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Account, 'id' | 'createdAt'>>
    }) => {
      const row = await apiFetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return toAccount(row)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots.all })
    },
  })
}
