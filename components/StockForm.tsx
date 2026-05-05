'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssetStore } from '@/lib/useAssetStore'
import { StockLocation, StockHolding } from '@/lib/types'

interface StockFormProps {
  editingId: string | null
  onClose: () => void
}

export default function StockForm({ editingId, onClose }: StockFormProps) {
  const { stocks, addStock, updateStock } = useAssetStore()
  const editingStock = editingId ? stocks.find((s) => s.id === editingId) : null

  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    location: 'nanovest' as StockLocation,
    quantity: '',
    averagePrice: '',
    currentPrice: '',
  })

  useEffect(() => {
    if (editingStock) {
      setFormData({
        ticker: editingStock.ticker,
        name: editingStock.name,
        location: editingStock.location,
        quantity: editingStock.quantity.toString(),
        averagePrice: editingStock.averagePrice.toString(),
        currentPrice: editingStock.currentPrice.toString(),
      })
    }
  }, [editingStock])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.ticker ||
      !formData.name ||
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
      location: formData.location,
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
      location: 'nanovest',
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
          <label className="text-sm font-medium">Lokasi Pembelian</label>
          <Select value={formData.location} onValueChange={(value) =>
            setFormData({ ...formData, location: value as StockLocation })
          }>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nanovest">Nanovest</SelectItem>
              <SelectItem value="ajaib">Ajaib</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
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
