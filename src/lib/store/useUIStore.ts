import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  hideValues: boolean
  toggleHideValues: () => void
  setHideValues: (value: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      hideValues: false,
      toggleHideValues: () => set((s) => ({ hideValues: !s.hideValues })),
      setHideValues: (hideValues) => set({ hideValues }),
    }),
    { name: 'wealth-ui' }
  )
)
