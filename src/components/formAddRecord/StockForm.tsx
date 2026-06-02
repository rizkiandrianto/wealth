'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
import type { StockHolding, StockLocation, StockMarket } from '@/lib/types'
import { useStocksQuery, useAddStock, useUpdateStock } from '@/lib/queries/stocks'
import { useStockLocationsQuery, useAddStockLocation } from '@/lib/queries/stockLocations'

interface StockFormProps {
  editingId: string | null
  onClose: () => void
}

// Stable empty fallbacks — destructure default `= []` allocates a new array
// every render, breaking referential equality for useEffect deps and causing
// an infinite re-render loop while query data is still loading.
const EMPTY_STOCKS: StockHolding[] = []
const EMPTY_LOCATIONS: StockLocation[] = []

export default function StockForm({ editingId, onClose }: StockFormProps) {
  const t = useTranslations('holdings.stocks')
  const tCommon = useTranslations('common')
  const tError = useTranslations('errors')
  const { data: stocks = EMPTY_STOCKS } = useStocksQuery()
  const { data: stockLocations = EMPTY_LOCATIONS } = useStockLocationsQuery()
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
    purchaseDate: string
  }>({
    ticker: '',
    market: 'IDX',
    locationId: stockLocations[0]?.id || '',
    quantity: '',
    averagePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (editingStock) {
      setFormData({
        ticker: editingStock.ticker,
        market: editingStock.market,
        locationId: editingStock.locationId,
        quantity: editingStock.quantity.toString(),
        averagePrice: editingStock.averagePrice.toString(),
        purchaseDate: new Date(editingStock.purchaseDate).toISOString().split('T')[0],
      })
      return
    }
    setFormData(prev => {
      const next = stockLocations.some(l => l.id === prev.locationId)
        ? prev.locationId
        : stockLocations[0]?.id ?? ''
      if (next === prev.locationId) return prev
      return { ...prev, locationId: next }
    })
  }, [editingStock, stockLocations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.ticker || !formData.locationId || !formData.quantity || !formData.averagePrice || !formData.purchaseDate) {
      alert(tError('allFieldsRequired'))
      return
    }

    const stockData = {
      ticker: formData.ticker.toUpperCase(),
      market: formData.market,
      locationId: formData.locationId,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      purchaseDate: new Date(formData.purchaseDate).getTime(),
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
      purchaseDate: new Date().toISOString().split('T')[0],
    })
    onClose()
  }

  return (
    <FormShell
      title={editingId ? t('editTitle') : t('addStock')}
      theme="blue"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('ticker')}</label>
            <Input
              placeholder="BBRI"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className='flex flex-col'>
            <label className="text-sm font-medium flex-1">{t('market')}</label>
            <Select
              value={formData.market}
              onValueChange={(v) => setFormData({ ...formData, market: v as StockMarket })}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDX">{t('marketIDX')}</SelectItem>
                <SelectItem value="US">{t('marketUS')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1">
          <div>
            <label className="text-sm font-medium flex-1">{t('locationPurchase')}</label>
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
            <label className="text-sm font-medium">{t('quantity')}</label>
            <Input
              type="number"
              placeholder="100"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="mt-1"
              step="0.00000001"
              min="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('averagePriceIDR')}</label>
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            {editingId ? t('updateStock') : t('addStock')}
          </Button>
        </div>
      </form>
    </FormShell>
  )
}
