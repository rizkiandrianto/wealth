'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { useAssetStore } from '@/lib/useAssetStore'
import LocationPickerSelect from '@/components/LocationPickerSelect'
import type { StockMarket } from '@/lib/types'

interface StockFormProps {
  editingId: string | null
  onClose: () => void
}

export default function StockForm({ editingId, onClose }: StockFormProps) {
  const { stocks, stockLocations, addStock, updateStock, addStockLocation } = useAssetStore()
  const editingStock = editingId ? stocks.find((s) => s.id === editingId) : null

  const [formData, setFormData] = useState<{
    ticker: string
    market: StockMarket
    locationId: string
    quantity: string
    averagePrice: string
  }>({
    ticker: '',
    market: 'IDX',
    locationId: stockLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
  })

  useEffect(() => {
    if (editingStock) {
      setFormData({
        ticker: editingStock.ticker,
        market: editingStock.market,
        locationId: editingStock.locationId,
        quantity: editingStock.quantity.toString(),
        averagePrice: editingStock.averagePrice.toString(),
      })
    } else {
      setFormData(prev => ({
        ...prev,
        locationId: stockLocations.find(l => l.id === prev.locationId)
          ? prev.locationId
          : stockLocations[0]?.id || '',
      }))
    }
  }, [editingStock, stockLocations])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.ticker || !formData.locationId || !formData.quantity || !formData.averagePrice) {
      alert('Semua field harus diisi')
      return
    }

    const stockData = {
      ticker: formData.ticker.toUpperCase(),
      market: formData.market,
      locationId: formData.locationId,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      purchaseDate: editingStock?.purchaseDate || Date.now(),
    }

    if (editingId) {
      updateStock(editingId, stockData)
    } else {
      addStock(stockData)
    }

    setFormData({
      ticker: '',
      market: 'IDX',
      locationId: stockLocations[0]?.id || '',
      quantity: '',
      averagePrice: '',
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
        <div>
          <label className="text-sm font-medium">Ticker</label>
          <Input
            placeholder="BBRI"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Pasar</label>
          <Select
            value={formData.market}
            onValueChange={(v) => setFormData({ ...formData, market: v as StockMarket })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDX">Indonesia (IDX)</SelectItem>
              <SelectItem value="US">US (NASDAQ/NYSE)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Lokasi Pembelian</label>
          <LocationPickerSelect
            locations={stockLocations}
            value={formData.locationId}
            onChange={(id) => setFormData({ ...formData, locationId: id })}
            onAddLocation={(name) => addStockLocation({ name })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Quantity (lot)</label>
            <Input
              type="number"
              placeholder="100"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
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
