'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CryptoHolding, CryptoLocation } from '@/lib/types'
import { useFormatCurrency } from '@/lib/format'
import { useDeleteCrypto, useSellCrypto, useSellCryptoBatch } from '@/lib/queries/crypto'
import { useAssetPricesQuery } from '@/lib/queries/prices'
import { Card } from '@/components/ui/card'
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

interface CryptosByLocationProps {
  cryptos: CryptoHolding[]
  locations: CryptoLocation[]
  onEdit: (id: string) => void
}

export default function CryptosByLocation({ cryptos, locations, onEdit }: CryptosByLocationProps) {
  const t = useTranslations('holdings.crypto')
  const tCommon = useTranslations('common')
  const tStocks = useTranslations('holdings.stocks')
  const { data: assetPrices = [] } = useAssetPricesQuery()
  const deleteCrypto = useDeleteCrypto()
  const sellCrypto = useSellCrypto()
  const sellCryptoBatch = useSellCryptoBatch()
  const formatCurrency = useFormatCurrency()
  const getPrice = (symbol: string) =>
    assetPrices.find((p) => p.ticker === symbol)?.price ?? 0

  const [sellingCryptoId, setSellingCryptoId] = useState<string | null>(null)
  const [sellingLocation, setSellingLocation] = useState<{ symbol: string; locationId: string } | null>(null)
  const sellingCrypto = sellingCryptoId ? cryptos.find((c) => c.id === sellingCryptoId) : null
  const sellingLocationLots = sellingLocation
    ? cryptos.filter((c) => c.symbol === sellingLocation.symbol && c.locationId === sellingLocation.locationId)
    : []
  const sellingLocationName = sellingLocation
    ? locations.find((l) => l.id === sellingLocation.locationId)?.name ?? ''
    : ''

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
    <>
      <Accordion type="multiple" className="space-y-3">
        {locations.map((location) => {
          const locationCryptos = groupedByLocation[location.id] || []
          if (locationCryptos.length === 0) return null

          const totalValue = locationCryptos.reduce((sum, c) => sum + c.quantity * getPrice(c.symbol), 0)
          const totalCost = locationCryptos.reduce((sum, c) => sum + c.quantity * c.averagePrice, 0)
          const profitLoss = totalValue - totalCost
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
          const isPositive = profitLoss >= 0

          // Sub-group lots by symbol within this location
          const symbolGroups = locationCryptos.reduce<Record<string, CryptoHolding[]>>((acc, c) => {
            if (!acc[c.symbol]) acc[c.symbol] = []
            acc[c.symbol].push(c)
            return acc
          }, {})

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
                <div className="space-y-2">
                  {Object.entries(symbolGroups)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([symbol, lots]) => {
                      const price = getPrice(symbol)
                      const totalQty = lots.reduce((sum, l) => sum + l.quantity, 0)
                      const cost = lots.reduce((sum, l) => sum + l.quantity * l.averagePrice, 0)
                      const weightedAvg = totalQty > 0 ? cost / totalQty : 0
                      const value = totalQty * price
                      const profit = value - cost
                      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0
                      const isPos = profit >= 0

                      return (
                        <Card key={symbol} className="p-4 border-l-4 border-l-purple-500">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{symbol}</h4>
                              <p className="text-sm text-muted-foreground">{lots[0].name}</p>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">{t('quantity')}</p>
                                  <p className="font-semibold">{totalQty.toFixed(8)}{lots.length > 1 ? ` • ${lots.length} lots` : ''}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">{t('averagePrice')}</p>
                                  <p className="font-semibold">{formatCurrency(weightedAvg)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">{t('currentPrice')}</p>
                                  <p className="font-semibold">{price > 0 ? formatCurrency(price) : '—'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="text-right ml-4">
                              <p className="text-xl font-bold">{formatCurrency(value)}</p>
                              <p className={`text-sm font-medium flex items-center justify-end gap-1 ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                {isPos ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                                {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
                              </p>
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
                                        if (confirm(t('deleteConfirmPrompt'))) {
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

                          <div className="mt-3 flex gap-2 justify-end pt-3 border-t">
                            {lots.length === 1 ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(lots[0].id)}
                                  className="gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  {tCommon('edit')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSellingCryptoId(lots[0].id)}
                                  className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  {t('sell')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(t('deleteConfirmPrompt'))) {
                                      deleteCrypto.mutate(lots[0].id)
                                    }
                                  }}
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {tCommon('delete')}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSellingLocation({ symbol, locationId: location.id })}
                                className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <DollarSign className="w-4 h-4" />
                                {tStocks('sellTickerFifo', { ticker: symbol })}
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
          locationName={sellingLocationName}
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
