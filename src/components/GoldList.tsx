'use client'

import { useState } from 'react'
import { GoldHolding, GoldLocation } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { useDeleteGold, useSellGold } from '@/lib/queries/gold'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import GoldSellDialog from './GoldSellDialog'

interface GoldListProps {
  golds: GoldHolding[]
  locations: GoldLocation[]
  onEdit: (id: string) => void
}

export default function GoldList({ golds, locations, onEdit }: GoldListProps) {
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const deleteGold = useDeleteGold()
  const sellGold = useSellGold()
  const formatCurrency = useFormatCurrency()
  const goldPrice = assetPrices.find((p) => p.ticker === 'XAU')?.price ?? 0
  const [sellingGoldId, setSellingGoldId] = useState<string | null>(null)
  const sellingGold = sellingGoldId ? golds.find((g) => g.id === sellingGoldId) : null

  const groupedByLocation = locations.reduce(
    (acc, loc) => {
      const locationGolds = golds.filter((g) => g.locationId === loc.id)
      if (locationGolds.length > 0) acc[loc.id] = { location: loc, golds: locationGolds }
      return acc
    },
    {} as Record<string, { location: GoldLocation; golds: GoldHolding[] }>
  )

  if (Object.keys(groupedByLocation).length === 0) return null

  return (
    <div className="space-y-6">
      {Object.values(groupedByLocation).map(({ location, golds: locationGolds }) => {
        const totalWeight = locationGolds.reduce((sum, g) => sum + g.weight, 0)
        const totalValue = goldPrice > 0 ? totalWeight * goldPrice : 0
        const totalCost = locationGolds.reduce((sum, g) => sum + g.weight * g.purchasePrice, 0)
        const profitLoss = totalValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
        const isPositive = profitLoss >= 0

        return (
          <div key={location.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{location.name}</h3>
              <span className="text-sm text-muted-foreground">({totalWeight.toFixed(4)} gram)</span>
            </div>

            <div className="space-y-3">
              {locationGolds.map((gold) => {
                const value = goldPrice > 0 ? gold.weight * goldPrice : 0
                const cost = gold.weight * gold.purchasePrice
                const pnlAmount = value - cost
                const pnlPercent = cost > 0 ? (pnlAmount / cost) * 100 : 0

                return (
                  <Card key={gold.id} className="p-4 border-l-4 border-l-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{gold.weight.toFixed(4)} gram</p>
                        <p className="text-sm text-muted-foreground">
                          Beli: {formatCurrency(gold.purchasePrice)}/gram · {new Date(gold.purchaseDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{goldPrice > 0 ? formatCurrency(value) : '—'}</p>
                        {goldPrice > 0 && (
                          <p className={`text-sm font-medium flex items-center justify-end gap-1 ${pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlAmount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {formatCurrency(pnlAmount)} ({pnlPercent.toFixed(2)}%)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(gold.id)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSellingGoldId(gold.id)}
                        className="gap-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      >
                        <DollarSign className="w-4 h-4" />
                        Jual
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Hapus holding emas ini?')) {
                            deleteGold.mutate(gold.id)
                          }
                        }}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {locationGolds.length > 1 && goldPrice > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Total {location.name}</span>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(totalValue)}</p>
                  <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitLoss)} ({profitLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {sellingGold && (
        <GoldSellDialog
          gold={sellingGold}
          onSell={(weight, salePrice) => {
            sellGold.mutate({ goldId: sellingGold.id, weight, salePrice })
            setSellingGoldId(null)
          }}
          onClose={() => setSellingGoldId(null)}
        />
      )}
    </div>
  )
}
