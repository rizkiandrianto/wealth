'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import FormShell from '@/components/FormShell'
import LocationPickerSelect from '@/components/LocationPickerSelect'
import type { CryptoHolding, CryptoLocation } from '@/lib/types'
import { useCryptosQuery, useAddCrypto, useUpdateCrypto } from '@/lib/queries/crypto'
import { useCryptoLocationsQuery, useAddCryptoLocation } from '@/lib/queries/cryptoLocations'

interface CryptoFormProps {
  editingId: string | null
  onClose: () => void
}

// Stable empty fallbacks — see StockForm for context on the re-render loop.
const EMPTY_CRYPTOS: CryptoHolding[] = []
const EMPTY_LOCATIONS: CryptoLocation[] = []

export default function CryptoForm({ editingId, onClose }: CryptoFormProps) {
  const t = useTranslations('holdings.crypto')
  const tCommon = useTranslations('common')
  const tError = useTranslations('errors')
  const { data: cryptos = EMPTY_CRYPTOS } = useCryptosQuery()
  const { data: cryptoLocations = EMPTY_LOCATIONS } = useCryptoLocationsQuery()
  const addCrypto = useAddCrypto()
  const updateCrypto = useUpdateCrypto()
  const addCryptoLocation = useAddCryptoLocation()
  const editingCrypto = editingId ? cryptos.find((c) => c.id === editingId) : null

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    locationId: cryptoLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  })
  const [nameLookupLoading, setNameLookupLoading] = useState(false)

  useEffect(() => {
    if (editingCrypto) {
      setFormData({
        symbol: editingCrypto.symbol,
        name: editingCrypto.name,
        locationId: editingCrypto.locationId,
        quantity: editingCrypto.quantity.toString(),
        averagePrice: editingCrypto.averagePrice.toString(),
        purchaseDate: new Date(editingCrypto.purchaseDate).toISOString().split('T')[0],
      })
      return
    }
    setFormData(prev => {
      const next = cryptoLocations.some(l => l.id === prev.locationId)
        ? prev.locationId
        : cryptoLocations[0]?.id ?? ''
      if (next === prev.locationId) return prev
      return { ...prev, locationId: next }
    })
  }, [editingCrypto, cryptoLocations])

  const handleSymbolBlur = async () => {
    const symbol = formData.symbol.trim()
    if (!symbol || formData.name) return

    setNameLookupLoading(true)
    try {
      const res = await fetch(`/api/market/crypto-search?symbol=${encodeURIComponent(symbol)}`)
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, name: data.name }))
      }
    } finally {
      setNameLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.symbol ||
      !formData.name ||
      !formData.locationId ||
      !formData.quantity ||
      !formData.averagePrice ||
      !formData.purchaseDate
    ) {
      alert(tError('allFieldsRequired'))
      return
    }

    const cryptoData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      locationId: formData.locationId,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      purchaseDate: new Date(formData.purchaseDate).getTime(),
    }

    if (editingId) {
      await updateCrypto.mutateAsync({ id: editingId, updates: cryptoData })
    } else {
      await addCrypto.mutateAsync(cryptoData)
    }

    setFormData({
      symbol: '',
      name: '',
      locationId: cryptoLocations[0]?.id || '',
      quantity: '',
      averagePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    })
    onClose()
  }

  return (
    <FormShell
      title={editingId ? t('editTitle') : t('addCrypto')}
      theme="purple"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('symbol')}</label>
            <Input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              onBlur={handleSymbolBlur}
              placeholder={t('symbolPlaceholder')}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('name')}</label>
            <div className="relative mt-1">
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('namePlaceholder')}
                className={nameLookupLoading ? 'pr-8' : ''}
              />
              {nameLookupLoading && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{t('locationStorage')}</label>
          <LocationPickerSelect
            locations={cryptoLocations}
            value={formData.locationId}
            onChange={(id) => setFormData({ ...formData, locationId: id })}
            onAddLocation={async (name) => (await addCryptoLocation.mutateAsync({ name })).id}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('quantity')}</label>
            <Input
              type="number"
              step="0.00000001"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('averagePriceIDR')}</label>
            <Input
              type="number"
              step="0.01"
              value={formData.averagePrice}
              onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{t('purchaseDate')}</label>
          <Input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="md:flex gap-2 md:justify-end grid grid-cols-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            {editingId ? t('updateCrypto') : t('addCrypto')}
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
