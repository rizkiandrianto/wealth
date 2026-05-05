'use client'

import Link from 'next/link'
import { useAssetStore } from '@/lib/useAssetStore'
import DashboardLayout from '@/components/DashboardLayout'
import DashboardSummary from '@/components/DashboardSummary'
import AccountsList from '@/components/AccountsList'
import RecentTransactions from '@/components/RecentTransactions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

export default function Home() {
  const store = useAssetStore()

  if (!store.mounted) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>
  }

  const totalStockValue = store.getTotalStockValue()
  const totalStockCost = store.stocks.reduce((sum, stock) => sum + stock.quantity * stock.averagePrice, 0)
  const totalStockProfit = totalStockValue - totalStockCost
  const totalStockProfitPercent = totalStockCost > 0 ? (totalStockProfit / totalStockCost) * 100 : 0
  const isStockPositive = totalStockProfit >= 0

  const totalCryptoValue = store.getTotalCryptoValue()
  const totalCryptoCost = store.cryptos.reduce((sum, crypto) => sum + crypto.quantity * crypto.averagePrice, 0)
  const totalCryptoProfit = totalCryptoValue - totalCryptoCost
  const totalCryptoProfitPercent = totalCryptoCost > 0 ? (totalCryptoProfit / totalCryptoCost) * 100 : 0
  const isCryptoPositive = totalCryptoProfit >= 0

  const realizedPnL = store.getTotalRealizedPnL()
  const isRealizedPositive = realizedPnL.total >= 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardSummary 
          totalBalance={store.getTotalBalance()}
          accountCount={store.accounts.length}
          transactionCount={store.transactions.length}
        />
        
        <AccountsList 
          accounts={store.accounts}
          getBalance={store.getAccountBalance}
        />

        {store.stocks.length > 0 && (
          <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Portfolio Saham</h3>
                <p className="text-sm text-muted-foreground mt-1">{store.stocks.length} saham dimiliki</p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${isStockPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isStockPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {formatCurrency(totalStockProfit)} ({totalStockProfitPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <Link href="/stocks">
                <Button variant="outline" className="gap-2">
                  Lihat Detail
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {store.cryptos.length > 0 && (
          <Card className="p-6 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Portfolio Crypto</h3>
                <p className="text-sm text-muted-foreground mt-1">{store.cryptos.length} crypto dimiliki</p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${isCryptoPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isCryptoPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {formatCurrency(totalCryptoProfit)} ({totalCryptoProfitPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <Link href="/crypto">
                <Button variant="outline" className="gap-2">
                  Lihat Detail
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {(store.stockSales.length > 0 || store.cryptoSales.length > 0) && (
          <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Realized P&L</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {store.stockSales.length} stock sales • {store.cryptoSales.length} crypto sales
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(realizedPnL.total)}</p>
                  {(realizedPnL.stocks !== 0 || realizedPnL.cryptos !== 0) && (
                    <div className="text-sm space-y-1 text-muted-foreground">
                      {realizedPnL.stocks !== 0 && (
                        <p className={realizedPnL.stocks >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Stocks: {formatCurrency(realizedPnL.stocks)}
                        </p>
                      )}
                      {realizedPnL.cryptos !== 0 && (
                        <p className={realizedPnL.cryptos >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Cryptos: {formatCurrency(realizedPnL.cryptos)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <RecentTransactions transactions={store.transactions.slice(-5).reverse()} />
      </div>
    </DashboardLayout>
  )
}
