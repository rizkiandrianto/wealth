'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssetStore } from '@/lib/useAssetStore'

interface CryptoFormProps {
  editingId: string | null
  onClose: () => void
}

export default function CryptoForm({ editingId, onClose }: CryptoFormProps) {
  const { cryptos, cryptoLocations, addCrypto, updateCrypto, addCryptoLocation } = useAssetStore()
  const editingCrypto = editingId ? cryptos.find((c) => c.id === editingId) : null
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    locationId: cryptoLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
    currentPrice: '',
  })

  useEffect(() => {
    if (editingCrypto) {
      setFormData({
        symbol: editingCrypto.symbol,
        name: editingCrypto.name,
        locationId: editingCrypto.locationId,
        quantity: editingCrypto.quantity.toString(),
        averagePrice: editingCrypto.averagePrice.toString(),
        currentPrice: editingCrypto.currentPrice.toString(),
      })
    } else {
      // Reset locationId when not editing
      setFormData(prev => ({
        ...prev,
        locationId: cryptoLocations[0]?.id || '',
      }))
    }
  }, [editingCrypto, cryptoLocations])

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return
    
    addCryptoLocation({ name: newLocationName })
    setNewLocationName('')
    setShowLocationForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.symbol ||
      !formData.name ||
      !formData.locationId ||
      !formData.quantity ||
      !formData.averagePrice ||
      !formData.currentPrice
    ) {
      alert('Semua field harus diisi')
      return
    }

    const cryptoData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      locationId: formData.locationId,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      currentPrice: parseFloat(formData.currentPrice),
      purchaseDate: editingCrypto?.purchaseDate || Date.now(),
    }

    if (editingId) {
      updateCrypto(editingId, cryptoData)
    } else {
      addCrypto(cryptoData)
    }

    setFormData({
      symbol: '',
      name: '',
      locationId: cryptoLocations[0]?.id || '',
      quantity: '',
      averagePrice: '',
      currentPrice: '',
    })
    onClose()
  }

  return (
    <Card className="p-6 border-l-4 border-l-purple-500 bg-purple-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{editingId ? 'Edit Crypto' : 'Tambah Crypto'}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Symbol</label>
            <Input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="e.g., BTC"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nama Crypto</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bitcoin"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Lokasi Penyimpanan</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationForm(!showLocationForm)}
              className="h-6 gap-1 px-2 text-xs"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </Button>
          </div>
          
          {showLocationForm && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <form onSubmit={handleAddLocation} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nama lokasi baru"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="flex-1"
                  size="sm"
                />
                <Button type="submit" size="sm" className="whitespace-nowrap">
                  Simpan
                </Button>
              </form>
            </div>
          )}

          <Select value={formData.locationId} onValueChange={(value) =>
            setFormData({ ...formData, locationId: value })
          }>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cryptoLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Quantity</label>
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
            <label className="text-sm font-medium">Harga Rata-rata (IDR)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.averagePrice}
              onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Harga Terkini (IDR)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.currentPrice}
              onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">
            {editingId ? 'Update' : 'Tambah'} Crypto
          </Button>
        </div>
      </form>
    </Card>
  )
}
