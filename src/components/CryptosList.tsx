'use client'

import { useState } from 'react'
import { CryptoHolding } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { useDeleteCrypto, useSellCrypto, useSellCryptoBatch } from '@/lib/queries/crypto'
import { useCryptoLocationsQuery } from '@/lib/queries/cryptoLocations'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Trash2, Edit2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import CryptoSellDialog from './CryptoSellDialog'
import CryptoSellLocationDialog from './CryptoSellLocationDialog'

interface CryptosListProps {
  cryptos: CryptoHolding[]
  onEdit: (id: string) => void
}

export default function CryptosList({ cryptos, onEdit }: CryptosListProps) {
  const { data: cryptoLocations = [] } = useCryptoLocationsQuery()
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const deleteCrypto = useDeleteCrypto()
  const sellCrypto = useSellCrypto()
  const sellCryptoBatch = useSellCryptoBatch()
  const formatCurrency = useFormatCurrency()
  const getPrice = (symbol: string) =>
    assetPrices.find((p) => p.ticker === symbol)?.price ?? 0
  const getLocationName = (locationId: string) =>
    cryptoLocations.find((l) => l.id === locationId)?.name ?? locationId

  const [sellingCryptoId, setSellingCryptoId] = useState<string | null>(null)
  const [sellingLocation, setSellingLocation] = useState<{ symbol: string; locationId: string } | null>(null)
  const sellingCrypto = sellingCryptoId ? cryptos.find((c) => c.id === sellingCryptoId) : null
  const sellingLocationLots = sellingLocation
    ? cryptos.filter((c) => c.symbol === sellingLocation.symbol && c.locationId === sellingLocation.locationId)
    : []

  // Group cryptos by symbol
  const groupedBySymbol = cryptos.reduce(
    (acc, crypto) => {
      const symbol = crypto.symbol
      if (!acc[symbol]) {
        acc[symbol] = []
      }
      acc[symbol].push(crypto)
      return acc
    },
    {} as Record<string, CryptoHolding[]>
  )

  return (
    <>
      <Accordion type="multiple" className="space-y-4">
        {Object.entries(groupedBySymbol)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([symbol, symbolCryptos]) => {
          const price = getPrice(symbol)
          const totalQuantity = symbolCryptos.reduce((sum, c) => sum + c.quantity, 0)
          const totalValue = totalQuantity * price
          const totalCost = symbolCryptos.reduce((sum, c) => sum + c.quantity * c.averagePrice, 0)
          const profitLoss = totalValue - totalCost
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
          const isPositive = profitLoss >= 0
          const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

          return (
            <AccordionItem
              key={symbol}
              value={symbol}
              className="border border-l-4 border-l-purple-500 rounded-lg bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-4 pr-2">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">{symbol}</h3>
                    <p className="text-sm text-muted-foreground">
                      {symbolCryptos[0].name}
                    </p>
                  </div>
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
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-muted/50 p-2 rounded">
                    <div>
                      <p className="text-muted-foreground text-xs">Quantity</p>
                      <p className="font-semibold">{totalQuantity.toFixed(8)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Avg Price</p>
                      <p className="font-semibold">{formatCurrency(averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Current Price</p>
                      <p className="font-semibold">{price > 0 ? formatCurrency(price) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total Cost</p>
                      <p className="font-semibold">{formatCurrency(totalCost)}</p>
                    </div>
                  </div>

                  {/* Per-location groups */}
                  {Object.entries(
                    symbolCryptos.reduce<Record<string, CryptoHolding[]>>((acc, c) => {
                      if (!acc[c.locationId]) acc[c.locationId] = []
                      acc[c.locationId].push(c)
                      return acc
                    }, {})
                  ).map(([locationId, locLots]) => {
                    const locQty = locLots.reduce((sum, l) => sum + l.quantity, 0)
                    const locCost = locLots.reduce((sum, l) => sum + l.quantity * l.averagePrice, 0)
                    const locWeightedAvg = locQty > 0 ? locCost / locQty : 0
                    const locValue = locQty * price
                    const locPnl = locValue - locCost
                    const locPnlPercent = locCost > 0 ? (locPnl / locCost) * 100 : 0
                    const locPositive = locPnl >= 0

                    return (
                      <div key={locationId} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{getLocationName(locationId)}</p>
                            <p className="text-xs text-muted-foreground">
                              {locQty.toFixed(8)} • avg {formatCurrency(locWeightedAvg)}
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
                            {locLots.map((lot) => (
                              <div
                                key={lot.id}
                                className="flex items-center justify-between text-xs p-2 bg-background rounded border border-border"
                              >
                                <p className="text-muted-foreground">
                                  {lot.quantity.toFixed(8)} @ {formatCurrency(lot.averagePrice)}
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
                                    onClick={() => {
                                      if (confirm('Delete this crypto holding?')) {
                                        deleteCrypto.mutate(lot.id)
                                      }
                                    }}
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
                                onClick={() => setSellingCryptoId(locLots[0].id)}
                                className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                <DollarSign className="w-3 h-3" />
                                Sell
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Delete this crypto holding?')) {
                                    deleteCrypto.mutate(locLots[0].id)
                                  }
                                }}
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
                              onClick={() => setSellingLocation({ symbol, locationId })}
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

      {sellingCrypto && (
        <CryptoSellDialog
          crypto={sellingCrypto}
          onSell={(quantity, salePrice) => {
            sellCrypto.mutate({ cryptoId: sellingCrypto.id, quantity, salePrice })
            setSellingCryptoId(null)
          }}
          onClose={() => setSellingCryptoId(null)}
        />
      )}

      {sellingLocation && sellingLocationLots.length > 0 && (
        <CryptoSellLocationDialog
          symbol={sellingLocation.symbol}
          locationId={sellingLocation.locationId}
          locationName={getLocationName(sellingLocation.locationId)}
          lots={sellingLocationLots}
          onSell={({ quantity, salePrice }) => {
            sellCryptoBatch.mutate({
              symbol: sellingLocation.symbol,
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
