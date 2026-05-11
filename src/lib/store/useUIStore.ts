import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PortfolioKey = 'cash' | 'stock' | 'crypto' | 'gold'

interface UIStore {
  hideValues: boolean
  toggleHideValues: () => void
  setHideValues: (value: boolean) => void
  excludedPortfolios: PortfolioKey[]
  togglePortfolioExclusion: (key: PortfolioKey) => void
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
    }),
    { name: 'wealth-ui' }
  )
)
