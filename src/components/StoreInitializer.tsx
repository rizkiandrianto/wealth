'use client'

import { useEffect, useRef } from 'react'
import { useAssetStore } from '@/lib/useAssetStore'

export default function StoreInitializer() {
  const fetchAll = useAssetStore((s) => s.fetchAll)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    fetchAll()
  }, [fetchAll])

  return null
}
