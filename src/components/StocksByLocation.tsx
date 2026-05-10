'use client'

import { StockHolding, StockLocation } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { useAssetStore } from '@/lib/useAssetStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react'

interface StocksByLocationProps {
  stocks: StockHolding[]
  locations: StockLocation[]
  onEdit: (id: string) => void
}

export default function StocksByLocation({ stocks, locations, onEdit }: StocksByLocationProps) {
  const { deleteStock, assetPrices } = useAssetStore()
  const getPrice = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.price ?? 0
  const getName = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.name ?? ticker

  // Group stocks by locationId
  const groupedByLocation = stocks.reduce(
    (acc, stock) => {
      const locationId = stock.locationId
      if (!acc[locationId]) {
        acc[locationId] = []
      }
      acc[locationId].push(stock)
      return acc
    },
    {} as Record<string, StockHolding[]>
  )

  return (
    <Accordion type="multiple" className="space-y-3">
      {locations.map((location) => {
        const locationStocks = groupedByLocation[location.id] || []
        if (locationStocks.length === 0) return null

        const totalValue = locationStocks.reduce((sum, s) => sum + stockShares(s) * getPrice(s.ticker), 0)
        const totalCost = locationStocks.reduce((sum, s) => sum + stockShares(s) * s.averagePrice, 0)
        const profitLoss = totalValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
        const isPositive = profitLoss >= 0

        return (
          <AccordionItem
            key={location.id}
            value={location.id}
            className="border rounded-lg bg-card px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-4 pr-2">
                <h3 className="text-lg font-semibold">{location.name}</h3>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{locationStocks.length} saham</p>
                  <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitLoss)}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {locationStocks.map((stock) => {
                const price = getPrice(stock.ticker)
                const shares = stockShares(stock)
                const value = shares * price
                const cost = shares * stock.averagePrice
                const profit = value - cost
                const profitPercent = cost > 0 ? (profit / cost) * 100 : 0
                const isPosStock = profit >= 0

                return (
                  <Card key={stock.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{stock.ticker}</h4>
                        <p className="text-sm text-muted-foreground">{getName(stock.ticker)}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Qty</p>
                            <p className="font-medium">{stock.quantity.toFixed(2)} lot</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Harga Rata-rata</p>
                            <p className="font-medium">{formatCurrency(stock.averagePrice)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Harga Terkini</p>
                            <p className="font-medium">{price > 0 ? formatCurrency(price) : '—'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Value</p>
                            <p className="font-medium">{formatCurrency(value)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right flex flex-col items-end gap-3">
                        <div>
                          <p className={`text-sm font-semibold flex items-center gap-1 ${isPosStock ? 'text-green-600' : 'text-red-600'}`}>
                            {isPosStock ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {formatCurrency(profit)}
                          </p>
                          <p className={`text-xs ${isPosStock ? 'text-green-600' : 'text-red-600'}`}>
                            {profitPercent.toFixed(2)}%
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(stock.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStock(stock.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
