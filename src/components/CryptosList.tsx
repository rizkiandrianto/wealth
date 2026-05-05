'use client'

import { useState } from 'react'
import { CryptoHolding } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { useAssetStore } from '@/lib/useAssetStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import CryptoSellDialog from './CryptoSellDialog'

interface CryptosListProps {
  cryptos: CryptoHolding[]
  onEdit: (id: string) => void
}

export default function CryptosList({ cryptos, onEdit }: CryptosListProps) {
  const { deleteCrypto, getCryptoProfitLoss, sellCrypto, assetPrices } = useAssetStore()
  const getPrice = (symbol: string) =>
    assetPrices.find((p) => p.ticker === symbol)?.price ?? 0
  const [sellingCryptoId, setSellingCryptoId] = useState<string | null>(null)
  const sellingCrypto = sellingCryptoId ? cryptos.find(c => c.id === sellingCryptoId) : null

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
    <div className="space-y-4">
      {Object.entries(groupedBySymbol).map(([symbol, symbolCryptos]) => {
        const price = getPrice(symbol)
        const totalQuantity = symbolCryptos.reduce((sum, c) => sum + c.quantity, 0)
        const totalValue = totalQuantity * price
        const totalCost = symbolCryptos.reduce((sum, c) => sum + c.quantity * c.averagePrice, 0)
        const profitLoss = totalValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
        const isPositive = profitLoss >= 0
        const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

        return (
          <Card key={symbol} className="p-4 border-l-4 border-l-purple-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
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

              <div className="grid grid-cols-4 gap-2 text-sm bg-muted/50 p-2 rounded">
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

              {symbolCryptos.length > 1 && (
                <div className="space-y-2 border-t pt-3">
                  {symbolCryptos.map((crypto) => {
                    const pl = getCryptoProfitLoss(crypto.id)
                    return (
                      <div key={crypto.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded">
                        <div>
                          <p className="text-muted-foreground">{crypto.quantity.toFixed(8)} @ {formatCurrency(crypto.averagePrice)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={pl.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(pl.amount)} ({pl.percentage.toFixed(2)}%)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(crypto.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this crypto holding?')) {
                                deleteCrypto(crypto.id)
                              }
                            }}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {symbolCryptos.length === 1 && (
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(symbolCryptos[0].id)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSellingCryptoId(symbolCryptos[0].id)}
                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <DollarSign className="w-4 h-4" />
                    Sell
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this crypto holding?')) {
                        deleteCrypto(symbolCryptos[0].id)
                      }
                    }}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )
      })}

      {sellingCrypto && (
        <CryptoSellDialog
          crypto={sellingCrypto}
          onSell={(quantity, salePrice) => {
            sellCrypto(sellingCrypto.id, quantity, salePrice)
            setSellingCryptoId(null)
          }}
          onClose={() => setSellingCryptoId(null)}
        />
      )}
    </div>
  )
}
