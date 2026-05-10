'use client'

import { useState } from 'react'
import { StockHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { stockShares } from '@/lib/stock'
import { useAssetStore } from '@/lib/useAssetStore'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Trash2, Edit2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import StockSellDialog from './StockSellDialog'

interface StocksListProps {
  stocks: StockHolding[]
  onEdit: (id: string) => void
}

export default function StocksList({ stocks, onEdit }: StocksListProps) {
  const { deleteStock, getStockProfitLoss, sellStock, stockLocations, assetPrices } = useAssetStore()
  const formatCurrency = useFormatCurrency()
  const getLocationName = (locationId: string) =>
    stockLocations.find((l) => l.id === locationId)?.name ?? locationId
  const getPrice = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.price ?? 0
  const getName = (ticker: string) =>
    assetPrices.find((p) => p.ticker === ticker)?.name ?? ticker
  const [sellingStockId, setSellingStockId] = useState<string | null>(null)
  const sellingStock = sellingStockId ? stocks.find(s => s.id === sellingStockId && stocks.some(x => x.id === sellingStockId)) : null

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

                {/* Individual holdings */}
                {tickerStocks.length > 1 && (
                  <div className="space-y-2">
                    {tickerStocks.map((stock) => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between text-sm p-2 bg-muted rounded border border-border"
                      >
                        <div className="flex-1">
                          <p className="text-muted-foreground capitalize">
                            {getLocationName(stock.locationId)} • {stock.quantity} lot
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(stock.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStock(stock.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions for single holding */}
                {tickerStocks.length === 1 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(tickerStocks[0].id)}
                      className="flex-1 gap-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSellingStockId(tickerStocks[0].id)}
                      className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      <DollarSign className="w-3 h-3" />
                      Sell
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteStock(tickerStocks[0].id)}
                      className="flex-1 gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </Button>
                  </div>
                )}
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
    </>
  )
}
