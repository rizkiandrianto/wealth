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

interface StockFormProps {
  editingId: string | null
  onClose: () => void
}

export default function StockForm({ editingId, onClose }: StockFormProps) {
  const { stocks, stockLocations, addStock, updateStock, addStockLocation } = useAssetStore()
  const editingStock = editingId ? stocks.find((s) => s.id === editingId) : null
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')

  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    locationId: stockLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
    currentPrice: '',
  })

  useEffect(() => {
    if (editingStock) {
      setFormData({
        ticker: editingStock.ticker,
        name: editingStock.name,
        locationId: editingStock.locationId,
        quantity: editingStock.quantity.toString(),
        averagePrice: editingStock.averagePrice.toString(),
        currentPrice: editingStock.currentPrice.toString(),
      })
    } else {
      // Reset locationId when not editing
      setFormData(prev => ({
        ...prev,
        locationId: stockLocations[0]?.id || '',
      }))
    }
  }, [editingStock, stockLocations])

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return
    
    addStockLocation({ name: newLocationName })
    setNewLocationName('')
    setShowLocationForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.ticker ||
      !formData.name ||
      !formData.locationId ||
      !formData.quantity ||
      !formData.averagePrice ||
      !formData.currentPrice
    ) {
      alert('Semua field harus diisi')
      return
    }

    const stockData = {
      ticker: formData.ticker.toUpperCase(),
      name: formData.name,
      locationId: formData.locationId,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      currentPrice: parseFloat(formData.currentPrice),
      purchaseDate: editingStock?.purchaseDate || Date.now(),
    }

    if (editingId) {
      updateStock(editingId, stockData)
    } else {
      addStock(stockData)
    }

    setFormData({
      ticker: '',
      name: '',
      locationId: stockLocations[0]?.id || '',
      quantity: '',
      averagePrice: '',
      currentPrice: '',
    })
    onClose()
  }

  return (
    <Card className="p-6 border border-blue-200 bg-blue-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {editingId ? 'Edit Saham' : 'Tambah Saham Baru'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Ticker</label>
            <Input
              placeholder="BBRI"
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nama Saham</label>
            <Input
              placeholder="Bank Rakyat Indonesia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Lokasi Pembelian</label>
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
              {stockLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Quantity (lot)</label>
            <Input
              type="number"
              placeholder="100"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="mt-1"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Harga Rata-rata (IDR)</label>
            <Input
              type="number"
              placeholder="15000"
              value={formData.averagePrice}
              onChange={(e) =>
                setFormData({ ...formData, averagePrice: e.target.value })
              }
              className="mt-1"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Harga Terkini (IDR)</label>
            <Input
              type="number"
              placeholder="16500"
              value={formData.currentPrice}
              onChange={(e) =>
                setFormData({ ...formData, currentPrice: e.target.value })
              }
              className="mt-1"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editingId ? 'Update Saham' : 'Tambah Saham'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Card>
  )
}
