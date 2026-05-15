'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CryptoHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface CryptoSellLocationDialogProps {
  symbol: string
  locationId: string
  locationName: string
  lots: CryptoHolding[]
  onSell: (input: { quantity: number; salePrice: number }) => void
  onClose: () => void
}

export default function CryptoSellLocationDialog({
  symbol,
  locationName,
  lots,
  onSell,
  onClose,
}: CryptoSellLocationDialogProps) {
  const t = useTranslations('sellDialog')
  const tCrypto = useTranslations('holdings.crypto')
  const tStocks = useTranslations('holdings.stocks')
  const tCommon = useTranslations('common')
  const tDash = useTranslations('dashboard')
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const formatCurrency = useFormatCurrency()
  const currentPrice = assetPrices.find((p) => p.ticker === symbol)?.price ?? 0

  const sortedLots = useMemo(
    () =>
      [...lots].sort((a, b) => {
        const at = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
        const bt = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
        if (at !== bt) return at - bt
        const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return ac - bc
      }),
    [lots]
  )

  const totalQty = sortedLots.reduce((s, l) => s + l.quantity, 0)
  const totalCost = sortedLots.reduce((s, l) => s + l.quantity * l.averagePrice, 0)
  const weightedAvg = totalQty > 0 ? totalCost / totalQty : 0

  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState(currentPrice > 0 ? currentPrice.toString() : '')

  const qtyNum = parseFloat(quantity) || 0
  const priceNum = parseFloat(salePrice) || 0

  const fifoPreview = useMemo(() => {
    if (qtyNum <= 0) return []
    let remaining = qtyNum
    const consumed: Array<{
      lot: CryptoHolding
      consumedQty: number
      pnl: number
    }> = []
    for (const lot of sortedLots) {
      if (remaining <= 0) break
      const take = Math.min(remaining, lot.quantity)
      const pnl = priceNum > 0 ? take * priceNum - take * lot.averagePrice : 0
      consumed.push({ lot, consumedQty: take, pnl })
      remaining -= take
    }
    return consumed
  }, [qtyNum, priceNum, sortedLots])

  const totalRealizedPnl = fifoPreview.reduce((s, c) => s + c.pnl, 0)
  const totalSaleValue = fifoPreview.reduce((s, c) => s + c.consumedQty * priceNum, 0)
  const totalCostConsumed = fifoPreview.reduce((s, c) => s + c.consumedQty * c.lot.averagePrice, 0)
  const realizedPercent = totalCostConsumed > 0 ? (totalRealizedPnl / totalCostConsumed) * 100 : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qtyNum <= 0 || qtyNum > totalQty + 1e-12 || priceNum <= 0) {
      alert(t('invalidQuantityOrPrice'))
      return
    }
    onSell({ quantity: qtyNum, salePrice: priceNum })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('sellTicker', { ticker: symbol })}</h2>
            <p className="text-xs text-muted-foreground">{locationName} • {t('fifoAcrossLots', { count: sortedLots.length })}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">{t('available')}:</span> <span className="font-semibold">{totalQty.toFixed(8)}</span></p>
            <p><span className="text-muted-foreground">{t('weightedAvgCost')}:</span> <span className="font-semibold">{formatCurrency(weightedAvg)}</span></p>
            <p><span className="text-muted-foreground">{tStocks('currentPrice')}:</span> <span className="font-semibold">{currentPrice > 0 ? formatCurrency(currentPrice) : '—'}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">{t('quantity')}</label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('salePricePerUnit')}</label>
              <Input
                type="number"
                step="any"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {fifoPreview.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase">{t('fifoConsumption')}</p>
              {fifoPreview.map((c, idx) => {
                const pct = c.lot.averagePrice > 0 ? (c.pnl / (c.consumedQty * c.lot.averagePrice)) * 100 : 0
                const pos = c.pnl >= 0
                return (
                  <div key={c.lot.id} className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0">
                    <div className="text-xs">
                      <p className="font-medium">{t('lotOfDecimal', { index: idx + 1, consumed: c.consumedQty.toFixed(8), total: c.lot.quantity.toFixed(8) })}</p>
                      <p className="text-muted-foreground">{t('avg')} {formatCurrency(c.lot.averagePrice)}</p>
                    </div>
                    <div className={`text-xs text-right ${pos ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="font-semibold">{formatCurrency(c.pnl)}</p>
                      <p>{pct.toFixed(2)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {qtyNum > 0 && priceNum > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg space-y-1 text-sm">
              <p><span className="text-muted-foreground">{t('totalSaleValue')}:</span> <span className="font-semibold">{formatCurrency(totalSaleValue)}</span></p>
              <p><span className="text-muted-foreground">{tStocks('totalCost')}:</span> <span className="font-semibold">{formatCurrency(totalCostConsumed)}</span></p>
              <p className={`font-semibold ${totalRealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tDash('realizedPnl')}: {formatCurrency(totalRealizedPnl)} ({realizedPercent.toFixed(2)}%)
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={qtyNum <= 0 || qtyNum > totalQty + 1e-12 || priceNum <= 0}>
              {tCrypto('sell')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
