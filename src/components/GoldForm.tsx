'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormShell from '@/components/FormShell'
import { useAssetStore } from '@/lib/useAssetStore'
import LocationPickerSelect from '@/components/LocationPickerSelect'

interface GoldFormProps {
  editingId: string | null
  onClose: () => void
}

export default function GoldForm({ editingId, onClose }: GoldFormProps) {
  const { golds, goldLocations, addGold, updateGold, addGoldLocation } = useAssetStore()
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
    } else {
      setFormData(prev => ({
        ...prev,
        locationId: goldLocations.find(l => l.id === prev.locationId)
          ? prev.locationId
          : goldLocations[0]?.id || '',
      }))
    }
  }, [editingGold, goldLocations])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.locationId || !formData.weight || !formData.purchasePrice || !formData.purchaseDate) {
      alert('Semua field harus diisi')
      return
    }

    const goldData = {
      locationId: formData.locationId,
      weight: parseFloat(formData.weight),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: new Date(formData.purchaseDate).getTime(),
    }

    if (editingId) {
      updateGold(editingId, goldData)
    } else {
      addGold(goldData)
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
      title={editingId ? 'Edit Emas' : 'Tambah Emas'}
      theme="yellow"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Lokasi Penyimpanan</label>
          <LocationPickerSelect
            locations={goldLocations}
            value={formData.locationId}
            onChange={(id) => setFormData({ ...formData, locationId: id })}
            onAddLocation={(name) => addGoldLocation({ name })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Berat (gram)</label>
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
            <label className="text-sm font-medium">Harga Beli (IDR/gram)</label>
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
          <label className="text-sm font-medium">Tanggal Beli</label>
          <Input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
            {editingId ? 'Update' : 'Tambah'} Emas
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
