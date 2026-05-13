'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FormShell from '@/components/FormShell'
import LocationPickerSelect from '@/components/LocationPickerSelect'
import type { StockMarket } from '@/lib/types'
import { useStocksQuery, useAddStock, useUpdateStock } from '@/lib/queries/stocks'
import { useStockLocationsQuery, useAddStockLocation } from '@/lib/queries/stockLocations'

interface StockFormProps {
  editingId: string | null
  onClose: () => void
}

export default function StockForm({ editingId, onClose }: StockFormProps) {
  const { data: stocks = [] } = useStocksQuery()
  const { data: stockLocations = [] } = useStockLocationsQuery()
  const addStock = useAddStock()
  const updateStock = useUpdateStock()
  const addStockLocation = useAddStockLocation()
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await updateStock.mutateAsync({ id: editingId, updates: stockData })
    } else {
      await addStock.mutateAsync(stockData)
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
    <FormShell
      title={editingId ? 'Edit Saham' : 'Tambah Saham Baru'}
      theme="blue"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Ticker</label>
            <Input
              placeholder="BBRI"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className='flex flex-col'>
            <label className="text-sm font-medium flex-1">Pasar</label>
            <Select
              value={formData.market}
              onValueChange={(v) => setFormData({ ...formData, market: v as StockMarket })}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDX">Indonesia (IDX)</SelectItem>
                <SelectItem value="US">US (NASDAQ/NYSE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1">
          <div>
            <label className="text-sm font-medium flex-1">Lokasi Pembelian</label>
            <LocationPickerSelect
              locations={stockLocations}
              value={formData.locationId}
              onChange={(id) => setFormData({ ...formData, locationId: id })}
              onAddLocation={async (name) => (await addStockLocation.mutateAsync({ name })).id}
            />
          </div>
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

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {editingId ? 'Update Saham' : 'Tambah Saham'}
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
