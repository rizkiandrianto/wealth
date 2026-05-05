'use client'

import { CryptoHolding, CryptoLocation } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { useAssetStore } from '@/lib/useAssetStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react'

interface CryptosByLocationProps {
  cryptos: CryptoHolding[]
  locations: CryptoLocation[]
  onEdit: (id: string) => void
}

export default function CryptosByLocation({ cryptos, locations, onEdit }: CryptosByLocationProps) {
  const { deleteCrypto } = useAssetStore()

  // Group cryptos by locationId
  const groupedByLocation = cryptos.reduce(
    (acc, crypto) => {
      const locationId = crypto.locationId
      if (!acc[locationId]) {
        acc[locationId] = []
      }
      acc[locationId].push(crypto)
      return acc
    },
    {} as Record<string, CryptoHolding[]>
  )

  return (
    <div className="space-y-6">
      {locations.map((location) => {
        const locationCryptos = groupedByLocation[location.id] || []
        if (locationCryptos.length === 0) return null

        const totalValue = locationCryptos.reduce((sum, c) => sum + c.quantity * c.currentPrice, 0)
        const totalCost = locationCryptos.reduce((sum, c) => sum + c.quantity * c.averagePrice, 0)
        const profitLoss = totalValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
        const isPositive = profitLoss >= 0

        return (
          <div key={location.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{location.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className={`text-sm font-medium flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatCurrency(profitLoss)} ({profitLossPercent.toFixed(2)}%)
                </p>
              </div>
            </div>

            {locationCryptos.map((crypto) => (
              <Card key={crypto.id} className="p-4 border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{crypto.symbol}</h4>
                    <p className="text-sm text-muted-foreground">{crypto.name}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Quantity</p>
                        <p className="font-semibold">{crypto.quantity.toFixed(8)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Avg Price</p>
                        <p className="font-semibold">{formatCurrency(crypto.averagePrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Current Price</p>
                        <p className="font-semibold">{formatCurrency(crypto.currentPrice)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-xl font-bold">{formatCurrency(crypto.quantity * crypto.currentPrice)}</p>
                    {(() => {
                      const pl = (() => {
                        const totalCost = crypto.quantity * crypto.averagePrice
                        const currentValue = crypto.quantity * crypto.currentPrice
                        const amount = currentValue - totalCost
                        const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0
                        return { amount, percentage }
                      })()
                      return (
                        <p className={`text-sm font-medium flex items-center justify-end gap-1 ${pl.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl.amount >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatCurrency(pl.amount)} ({pl.percentage.toFixed(2)}%)
                        </p>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(crypto.id)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this crypto holding?')) {
                        deleteCrypto(crypto.id)
                      }
                    }}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      })}
    </div>
  )
}
