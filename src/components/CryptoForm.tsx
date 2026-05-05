'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X } from 'lucide-react'
import { useAssetStore } from '@/lib/useAssetStore'
import LocationPickerSelect from '@/components/LocationPickerSelect'

interface CryptoFormProps {
  editingId: string | null
  onClose: () => void
}

export default function CryptoForm({ editingId, onClose }: CryptoFormProps) {
  const { cryptos, cryptoLocations, addCrypto, updateCrypto, addCryptoLocation } = useAssetStore()
  const editingCrypto = editingId ? cryptos.find((c) => c.id === editingId) : null

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    locationId: cryptoLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
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
      })
    } else {
      setFormData(prev => ({
        ...prev,
        locationId: cryptoLocations.find(l => l.id === prev.locationId)
          ? prev.locationId
          : cryptoLocations[0]?.id || '',
      }))
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.symbol ||
      !formData.name ||
      !formData.locationId ||
      !formData.quantity ||
      !formData.averagePrice
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
      currentPrice: editingCrypto?.currentPrice ?? 0,
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
              onBlur={handleSymbolBlur}
              placeholder="e.g., BTC"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nama Crypto</label>
            <div className="relative mt-1">
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bitcoin"
                className={nameLookupLoading ? 'pr-8' : ''}
              />
              {nameLookupLoading && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Lokasi Penyimpanan</label>
          <LocationPickerSelect
            locations={cryptoLocations}
            value={formData.locationId}
            onChange={(id) => setFormData({ ...formData, locationId: id })}
            onAddLocation={(name) => addCryptoLocation({ name })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
