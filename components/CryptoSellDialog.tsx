'use client'

import { useState } from 'react'
import { CryptoHolding } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface CryptoSellDialogProps {
  crypto: CryptoHolding
  onSell: (quantity: number, salePrice: number) => void
  onClose: () => void
}

export default function CryptoSellDialog({ crypto, onSell, onClose }: CryptoSellDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState(crypto.currentPrice.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const qty = parseFloat(quantity)
    const price = parseFloat(salePrice)
    
    if (!qty || qty <= 0 || qty > crypto.quantity || !price || price <= 0) {
      alert('Invalid quantity or price')
      return
    }

    onSell(qty, price)
    onClose()
  }

  const totalSaleValue = quantity ? parseFloat(quantity) * parseFloat(salePrice) : 0
  const totalCostValue = quantity ? parseFloat(quantity) * crypto.averagePrice : 0
  const profit = totalSaleValue - totalCostValue
  const profitPercent = totalCostValue > 0 ? (profit / totalCostValue) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Sell {crypto.symbol}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">Available:</span> <span className="font-semibold">{crypto.quantity.toFixed(8)}</span></p>
            <p><span className="text-muted-foreground">Average Cost:</span> <span className="font-semibold">{formatCurrency(crypto.averagePrice)}</span></p>
            <p><span className="text-muted-foreground">Current Price:</span> <span className="font-semibold">{formatCurrency(crypto.currentPrice)}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity to Sell</label>
            <Input
              type="number"
              step="0.00000001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sale Price (per unit)</label>
            <Input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {quantity && salePrice && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
              <p><span className="text-muted-foreground">Total Sale Value:</span> <span className="font-semibold">{formatCurrency(totalSaleValue)}</span></p>
              <p><span className="text-muted-foreground">Total Cost Value:</span> <span className="font-semibold">{formatCurrency(totalCostValue)}</span></p>
              <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Realized P&L: {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Sell
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
