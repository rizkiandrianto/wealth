'use client'

import { useState } from 'react'
import { StockHolding, StockLocation } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
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
import { Trash2, Edit2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import StockSellDialog from './StockSellDialog'
import StockSellLocationDialog from './StockSellLocationDialog'

interface StocksByLocationProps {
  stocks: StockHolding[]
  locations: StockLocation[]
  onEdit: (id: string) => void
}

export default function StocksByLocation({ stocks, locations, onEdit }: StocksByLocationProps) {
  const { deleteStock, sellStock, sellStockBatch, assetPrices } = useAssetStore()
  const formatCurrency = useFormatCurrency()
  const getPrice = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.price ?? 0
  const getName = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.name ?? ticker

  const [sellingStockId, setSellingStockId] = useState<string | null>(null)
  const [sellingLocation, setSellingLocation] = useState<{ ticker: string; locationId: string } | null>(null)
  const sellingStock = sellingStockId ? stocks.find((s) => s.id === sellingStockId) : null
  const sellingLocationLots = sellingLocation
    ? stocks.filter((s) => s.ticker === sellingLocation.ticker && s.locationId === sellingLocation.locationId)
    : []
  const sellingLocationName = sellingLocation
    ? locations.find((l) => l.id === sellingLocation.locationId)?.name ?? ''
    : ''

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
    <>
      <Accordion type="multiple" className="space-y-3">
        {locations.map((location) => {
          const locationStocks = groupedByLocation[location.id] || []
          if (locationStocks.length === 0) return null

          const totalValue = locationStocks.reduce((sum, s) => sum + stockShares(s) * getPrice(s.ticker), 0)
          const totalCost = locationStocks.reduce((sum, s) => sum + stockShares(s) * s.averagePrice, 0)
          const profitLoss = totalValue - totalCost
          const isPositive = profitLoss >= 0

          // Sub-group lots by ticker within this location
          const tickerGroups = locationStocks.reduce<Record<string, StockHolding[]>>((acc, s) => {
            if (!acc[s.ticker]) acc[s.ticker] = []
            acc[s.ticker].push(s)
            return acc
          }, {})

          const tickerCount = Object.keys(tickerGroups).length

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
                    <p className="text-sm text-muted-foreground">{tickerCount} saham</p>
                    <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {Object.entries(tickerGroups)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ticker, lots]) => {
                      const price = getPrice(ticker)
                      const shares = lots.reduce((sum, l) => sum + stockShares(l), 0)
                      const totalQty = lots.reduce((sum, l) => sum + l.quantity, 0)
                      const cost = lots.reduce((sum, l) => sum + stockShares(l) * l.averagePrice, 0)
                      const weightedAvg = shares > 0 ? cost / shares : 0
                      const value = shares * price
                      const profit = value - cost
                      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0
                      const isPosStock = profit >= 0

                      return (
                        <Card key={ticker} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{ticker}</h4>
                              <p className="text-sm text-muted-foreground">{getName(ticker)}</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Qty</p>
                                  <p className="font-medium">{totalQty.toFixed(2)} lot{lots.length > 1 ? ` • ${lots.length} lots` : ''}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Harga Rata-rata</p>
                                  <p className="font-medium">{formatCurrency(weightedAvg)}</p>
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
                            </div>
                          </div>

                          {lots.length > 1 && (
                            <div className="mt-3 space-y-1">
                              {lots.map((lot) => (
                                <div
                                  key={lot.id}
                                  className="flex items-center justify-between text-xs p-2 bg-muted rounded border border-border"
                                >
                                  <p className="text-muted-foreground">
                                    {lot.quantity} lot @ {formatCurrency(lot.averagePrice)}
                                  </p>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onEdit(lot.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteStock(lot.id)}
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            {lots.length === 1 ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEdit(lots[0].id)}
                                  className="flex-1 gap-2"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSellingStockId(lots[0].id)}
                                  className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Sell
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteStock(lots[0].id)}
                                  className="flex-1 gap-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Hapus
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSellingLocation({ ticker, locationId: location.id })}
                                className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                <DollarSign className="w-3 h-3" />
                                Sell {ticker} (FIFO)
                              </Button>
                            )}
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

      {sellingStock && (
        <StockSellDialog
          stock={sellingStock}
          onSell={(quantity, salePrice) => {
            sellStock(sellingStock.id, quantity, salePrice)
            setSellingStockId(null)
          }}
          onClose={() => setSellingStockId(null)}
        />
      )}

      {sellingLocation && sellingLocationLots.length > 0 && (
        <StockSellLocationDialog
          ticker={sellingLocation.ticker}
          locationId={sellingLocation.locationId}
          locationName={sellingLocationName}
          lots={sellingLocationLots}
          onSell={({ quantity, salePrice }) => {
            sellStockBatch({
              ticker: sellingLocation.ticker,
              locationId: sellingLocation.locationId,
              quantity,
              salePrice,
            })
            setSellingLocation(null)
          }}
          onClose={() => setSellingLocation(null)}
        />
      )}
    </>
  )
}
