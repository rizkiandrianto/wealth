'use client'

import { useState } from 'react'
import { StockHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { useDeleteStock, useSellStock, useSellStockBatch } from '@/lib/queries/stocks'
import { useStockLocationsQuery } from '@/lib/queries/stockLocations'
import { useAssetPricesQuery } from '@/lib/queries/prices'
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

interface StocksListProps {
  stocks: StockHolding[]
  onEdit: (id: string) => void
}

export default function StocksList({ stocks, onEdit }: StocksListProps) {
  const { data: stockLocations = [] } = useStockLocationsQuery()
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const deleteStock = useDeleteStock()
  const sellStock = useSellStock()
  const sellStockBatch = useSellStockBatch()
  const formatCurrency = useFormatCurrency()
  const getLocationName = (locationId: string) =>
    stockLocations.find((l) => l.id === locationId)?.name ?? locationId
  const getPrice = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.price ?? 0
  const getName = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.name ?? ticker
  const [sellingStockId, setSellingStockId] = useState<string | null>(null)
  const [sellingLocation, setSellingLocation] = useState<{ ticker: string; locationId: string } | null>(null)
  const sellingStock = sellingStockId ? stocks.find(s => s.id === sellingStockId) : null
  const sellingLocationLots = sellingLocation
    ? stocks.filter((s) => s.ticker === sellingLocation.ticker && s.locationId === sellingLocation.locationId)
    : []

  // Group stocks by ticker
  const groupedByTicker = stocks.reduce(
    (acc, stock) => {
      const ticker = stock.ticker
      if (!acc[ticker]) {
        acc[ticker] = []
      }
      acc[ticker].push(stock)
      return acc
    },
    {} as Record<string, StockHolding[]>
  )

  return (
    <>
      <Accordion type="multiple" className="space-y-3">
        {Object.entries(groupedByTicker)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([ticker, tickerStocks]) => {
          const price = getPrice(ticker)
          const totalQuantity = tickerStocks.reduce((sum, s) => sum + s.quantity, 0)
          const totalShares = tickerStocks.reduce((sum, s) => sum + stockShares(s), 0)
          const totalCost = tickerStocks.reduce((sum, s) => sum + stockShares(s) * s.averagePrice, 0)
          const totalValue = totalShares * price
          const profitLoss = totalValue - totalCost
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
          const isPositive = profitLoss >= 0

          return (
            <AccordionItem
              key={ticker}
              value={ticker}
              className="border rounded-lg bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-start justify-between gap-4 pr-2">
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{ticker}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getName(ticker)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
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
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Holdings details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted p-3 rounded">
                  <div>
                    <p className="text-muted-foreground text-xs">Qty</p>
                    <p className="font-semibold">{totalQuantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Harga Rata-rata</p>
                    <p className="font-semibold">{formatCurrency(totalShares > 0 ? totalCost / totalShares : 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Harga Terkini</p>
                    <p className="font-semibold">{price > 0 ? formatCurrency(price) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Cost</p>
                    <p className="font-semibold">{formatCurrency(totalCost)}</p>
                  </div>
                </div>

                {/* Per-location groups */}
                {Object.entries(
                  tickerStocks.reduce<Record<string, StockHolding[]>>((acc, s) => {
                    if (!acc[s.locationId]) acc[s.locationId] = []
                    acc[s.locationId].push(s)
                    return acc
                  }, {})
                ).map(([locationId, locLots]) => {
                  const locShares = locLots.reduce((sum, l) => sum + stockShares(l), 0)
                  const locCost = locLots.reduce((sum, l) => sum + stockShares(l) * l.averagePrice, 0)
                  const locWeightedAvg = locShares > 0 ? locCost / locShares : 0
                  const locTotalQty = locLots.reduce((sum, l) => sum + l.quantity, 0)
                  const locValue = locShares * price
                  const locPnl = locValue - locCost
                  const locPnlPercent = locCost > 0 ? (locPnl / locCost) * 100 : 0
                  const locPositive = locPnl >= 0

                  return (
                    <div key={locationId} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{getLocationName(locationId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {locTotalQty} lot • avg {formatCurrency(locWeightedAvg)}
                          </p>
                        </div>
                        {price > 0 && (
                          <p className={`text-xs font-medium ${locPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(locPnl)} ({locPnlPercent.toFixed(2)}%)
                          </p>
                        )}
                      </div>

                      {locLots.length > 1 && (
                        <div className="space-y-1">
                          {locLots.map((stock) => (
                            <div
                              key={stock.id}
                              className="flex items-center justify-between text-xs p-2 bg-background rounded border border-border"
                            >
                              <div className="flex-1">
                                <p className="text-muted-foreground">
                                  {stock.quantity} lot @ {formatCurrency(stock.averagePrice)}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEdit(stock.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteStock.mutate(stock.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {locLots.length === 1 ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(locLots[0].id)}
                              className="flex-1 gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSellingStockId(locLots[0].id)}
                              className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              <DollarSign className="w-3 h-3" />
                              Sell
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteStock.mutate(locLots[0].id)}
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
                            onClick={() => setSellingLocation({ ticker, locationId })}
                            className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            <DollarSign className="w-3 h-3" />
                            Sell from {getLocationName(locationId)} (FIFO)
                          </Button>
                        )}
                      </div>
                    </div>
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
            sellStock.mutate({ stockId: sellingStock.id, quantity, salePrice })
            setSellingStockId(null)
          }}
          onClose={() => setSellingStockId(null)}
        />
      )}

      {sellingLocation && sellingLocationLots.length > 0 && (
        <StockSellLocationDialog
          ticker={sellingLocation.ticker}
          locationId={sellingLocation.locationId}
          locationName={getLocationName(sellingLocation.locationId)}
          lots={sellingLocationLots}
          onSell={({ quantity, salePrice }) => {
            sellStockBatch.mutate({
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
