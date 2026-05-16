import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { useGuardedMutation } from './useGuardedMutation'

export interface AppSettingRow {
  id: string
  userId: string
  key: string
  value: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export const settingsQueryKey = (prefix?: string) =>
  prefix ? (['settings', prefix] as const) : (['settings'] as const)

export const settingsQueryOptions = (prefix?: string) => ({
  queryKey: settingsQueryKey(prefix),
  queryFn: async (): Promise<AppSettingRow[]> => {
    const path = prefix
      ? `/api/settings?prefix=${encodeURIComponent(prefix)}`
      : '/api/settings'
    return apiFetch(path)
  },
})

export function useSettingsQuery(prefix?: string) {
  return useQuery(settingsQueryOptions(prefix))
}

export interface UpsertSettingInput {
  key: string
  value: string
  description?: string
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (input: UpsertSettingInput) => {
      return apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteSetting() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (key: string) => {
      return apiFetch('/api/settings', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
