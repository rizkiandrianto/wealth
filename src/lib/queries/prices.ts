import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { toAssetPrice, Row } from '@/lib/normalizers'
import { AssetPrice } from '@/lib/types'
import { queryKeys } from './keys'

export const assetPricesQueryOptions = () => ({
  queryKey: queryKeys.assetPrices,
  queryFn: async (): Promise<AssetPrice[]> => {
    const rows: Row[] = await apiFetch('/api/market/prices')
    return rows.map(toAssetPrice)
  },
  staleTime: 30_000,
  refetchOnWindowFocus: true,
})

export function useAssetPricesQuery() {
  return useQuery(assetPricesQueryOptions())
}
