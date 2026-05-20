'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StockHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { sharesFor } from '@/lib/stock'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface StockSellDialogProps {
  stock: StockHolding
  onSell: (quantity: number, salePrice: number, saleDate: string) => void
  onClose: () => void
}

export default function StockSellDialog({ stock, onSell, onClose }: StockSellDialogProps) {
  const t = useTranslations('sellDialog')
  const tStocks = useTranslations('holdings.stocks')
  const tCommon = useTranslations('common')
  const tDash = useTranslations('dashboard')
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const formatCurrency = useFormatCurrency()
  const currentPrice = assetPrices.find((p) => p.ticker === stock.ticker)?.price ?? 0
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState(currentPrice > 0 ? currentPrice.toString() : '')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const qty = parseFloat(quantity)
    const price = parseFloat(salePrice)

    if (!qty || qty <= 0 || qty > stock.quantity || !price || price <= 0 || !saleDate) {
      alert(t('invalidQuantityOrPrice'))
      return
    }

    onSell(qty, price, saleDate)
    onClose()
  }

  const sellShares = quantity ? sharesFor(stock.market, parseFloat(quantity)) : 0
  const totalSaleValue = quantity && salePrice ? sellShares * parseFloat(salePrice) : 0
  const totalCostValue = quantity ? sellShares * stock.averagePrice : 0
  const profit = totalSaleValue - totalCostValue
  const profitPercent = totalCostValue > 0 ? (profit / totalCostValue) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('sellTicker', { ticker: stock.ticker })}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">{t('available')}:</span> <span className="font-semibold">{stock.quantity.toFixed(8)}</span></p>
            <p><span className="text-muted-foreground">{t('averageCost')}:</span> <span className="font-semibold">{formatCurrency(stock.averagePrice)}</span></p>
            <p><span className="text-muted-foreground">{tStocks('currentPrice')}:</span> <span className="font-semibold">{currentPrice > 0 ? formatCurrency(currentPrice) : '—'}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('quantityToSell')}</label>
            <Input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('salePricePerUnit')}</label>
            <Input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('saleDate')}</label>
            <Input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>

          {quantity && salePrice && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
              <p><span className="text-muted-foreground">{t('totalSaleValue')}:</span> <span className="font-semibold">{formatCurrency(totalSaleValue)}</span></p>
              <p><span className="text-muted-foreground">{t('totalCostValue')}:</span> <span className="font-semibold">{formatCurrency(totalCostValue)}</span></p>
              <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tDash('realizedPnl')}: {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              {tStocks('sell')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
