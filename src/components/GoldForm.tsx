'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormShell from '@/components/FormShell'
import LocationPickerSelect from '@/components/LocationPickerSelect'
import type { GoldHolding, GoldLocation } from '@/lib/types'
import { useGoldsQuery, useAddGold, useUpdateGold } from '@/lib/queries/gold'
import { useGoldLocationsQuery, useAddGoldLocation } from '@/lib/queries/goldLocations'

interface GoldFormProps {
  editingId: string | null
  onClose: () => void
}

// Stable empty fallbacks — see StockForm for context on the re-render loop.
const EMPTY_GOLDS: GoldHolding[] = []
const EMPTY_LOCATIONS: GoldLocation[] = []

export default function GoldForm({ editingId, onClose }: GoldFormProps) {
  const t = useTranslations('holdings.gold')
  const tCommon = useTranslations('common')
  const tError = useTranslations('errors')
  const { data: golds = EMPTY_GOLDS } = useGoldsQuery()
  const { data: goldLocations = EMPTY_LOCATIONS } = useGoldLocationsQuery()
  const addGold = useAddGold()
  const updateGold = useUpdateGold()
  const addGoldLocation = useAddGoldLocation()
  const editingGold = editingId ? golds.find((g) => g.id === editingId) : null

  const [formData, setFormData] = useState({
    locationId: goldLocations[0]?.id || '',
    weight: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (editingGold) {
      setFormData({
        locationId: editingGold.locationId,
        weight: editingGold.weight.toString(),
        purchasePrice: editingGold.purchasePrice.toString(),
        purchaseDate: new Date(editingGold.purchaseDate).toISOString().split('T')[0],
      })
      return
    }
    setFormData(prev => {
      const next = goldLocations.some(l => l.id === prev.locationId)
        ? prev.locationId
        : goldLocations[0]?.id ?? ''
      if (next === prev.locationId) return prev
      return { ...prev, locationId: next }
    })
  }, [editingGold, goldLocations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.locationId || !formData.weight || !formData.purchasePrice || !formData.purchaseDate) {
      alert(tError('allFieldsRequired'))
      return
    }

    const goldData = {
      locationId: formData.locationId,
      weight: parseFloat(formData.weight),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: new Date(formData.purchaseDate).getTime(),
    }

    if (editingId) {
      await updateGold.mutateAsync({ id: editingId, updates: goldData })
    } else {
      await addGold.mutateAsync(goldData)
    }

    setFormData({
      locationId: goldLocations[0]?.id || '',
      weight: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    })
    onClose()
  }

  return (
    <FormShell
      title={editingId ? t('editTitle') : t('addGold')}
      theme="yellow"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t('locationStorage')}</label>
          <LocationPickerSelect
            locations={goldLocations}
            value={formData.locationId}
            onChange={(id) => setFormData({ ...formData, locationId: id })}
            onAddLocation={async (name) => (await addGoldLocation.mutateAsync({ name })).id}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('weight')}</label>
            <Input
              type="number"
              step="0.0001"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="0.0000"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('purchasePrice')}</label>
            <Input
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
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
          <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
            {editingId ? t('updateGold') : t('addGold')}
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
