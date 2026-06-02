'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GoldHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface GoldSellDialogProps {
  gold: GoldHolding
  onSell: (weight: number, salePrice: number, saleDate: string) => void
  onClose: () => void
}

export default function GoldSellDialog({ gold, onSell, onClose }: GoldSellDialogProps) {
  const t = useTranslations('sellDialog')
  const tGold = useTranslations('holdings.gold')
  const tCommon = useTranslations('common')
  const tDash = useTranslations('dashboard')
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const formatCurrency = useFormatCurrency()
  const currentPrice = assetPrices.find((p) => p.ticker === 'XAU')?.price ?? 0
  const [weight, setWeight] = useState('')
  const [salePrice, setSalePrice] = useState(currentPrice > 0 ? currentPrice.toString() : '')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const w = parseFloat(weight)
    const price = parseFloat(salePrice)

    if (!w || w <= 0 || w > gold.weight || !price || price <= 0 || !saleDate) {
      alert(t('invalidWeightOrPrice'))
      return
    }

    onSell(w, price, saleDate)
    onClose()
  }

  const totalSaleValue = weight && salePrice ? parseFloat(weight) * parseFloat(salePrice) : 0
  const totalCostValue = weight ? parseFloat(weight) * gold.purchasePrice : 0
  const profit = totalSaleValue - totalCostValue
  const profitPercent = totalCostValue > 0 ? (profit / totalCostValue) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{tGold('sellTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">{t('available')}:</span> <span className="font-semibold">{gold.weight.toFixed(4)} gram</span></p>
            <p><span className="text-muted-foreground">{tGold('purchasePrice')}:</span> <span className="font-semibold">{formatCurrency(gold.purchasePrice)}/gram</span></p>
            <p><span className="text-muted-foreground">{tGold('currentPrice')}:</span> <span className="font-semibold">{currentPrice > 0 ? `${formatCurrency(currentPrice)}/gram` : '—'}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('weightSold')}</label>
            <Input
              type="number"
              step="0.00000001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('salePricePerGram')}</label>
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

          {weight && salePrice && (
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
            <Button type="submit" className="flex-1 bg-yellow-600 hover:bg-yellow-700">
              {tGold('sell')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
