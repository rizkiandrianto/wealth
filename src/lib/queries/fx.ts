import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { queryKeys } from './keys'

export type UsdIdrRate = {
  pair: 'USDIDR'
  rate: number
}

export const usdIdrQueryOptions = () => ({
  queryKey: queryKeys.fxUsdIdr,
  queryFn: async (): Promise<UsdIdrRate | null> => {
    try {
      return await apiFetch('/api/market/fx/usd-idr')
    } catch {
      return null
    }
  },
})

export function useUsdIdrQuery() {
  return useQuery(usdIdrQueryOptions())
}
