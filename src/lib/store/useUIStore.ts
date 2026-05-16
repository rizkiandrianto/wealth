import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SnapshotRange } from '@/lib/snapshot'
import type { ViewType } from '@/components/history/ViewTypeSelector'

export type PortfolioKey = 'cash' | 'stock' | 'crypto' | 'gold'

interface UIStore {
  hideValues: boolean
  toggleHideValues: () => void
  setHideValues: (value: boolean) => void
  excludedPortfolios: PortfolioKey[]
  togglePortfolioExclusion: (key: PortfolioKey) => void
  historyRange: SnapshotRange
  setHistoryRange: (range: SnapshotRange) => void
  historyViewType: ViewType
  setHistoryViewType: (viewType: ViewType) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      hideValues: false,
      toggleHideValues: () => set((s) => ({ hideValues: !s.hideValues })),
      setHideValues: (hideValues) => set({ hideValues }),
      excludedPortfolios: [],
      togglePortfolioExclusion: (key) =>
        set((s) => ({
          excludedPortfolios: s.excludedPortfolios.includes(key)
            ? s.excludedPortfolios.filter((k) => k !== key)
            : [...s.excludedPortfolios, key],
        })),
      historyRange: '3m',
      setHistoryRange: (historyRange) => set({ historyRange }),
      historyViewType: 'month',
      setHistoryViewType: (historyViewType) => set({ historyViewType }),
    }),
    { name: 'wealth-ui' }
  )
)
