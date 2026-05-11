'use client'

import { useAssetStore } from '@/lib/useAssetStore'
import DashboardLayout from '@/components/DashboardLayout'
import DashboardSummary from '@/components/DashboardSummary'
import AccountsList from '@/components/AccountsList'
import RecentTransactions from '@/components/RecentTransactions'
import PageLoader from '@/components/PageLoader'
import QuickAddFab from '@/components/QuickAddFab'
import { Card } from '@/components/ui/card'
import { useFormatCurrency } from '@/lib/format'

export default function Home() {
  const store = useAssetStore()
  const hasHydrated = useAssetStore((s) => s.hasHydrated)
  const formatCurrency = useFormatCurrency()

  if (!hasHydrated) {
    return <PageLoader />
  }

  

  const realizedPnL = store.getTotalRealizedPnL()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardSummary 
          totalBalance={store.getTotalBalance()}
          accountCount={store.accounts.length}
          transactionCount={store.transactions.length}
        />

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
        
        <AccountsList 
          accounts={store.accounts}
          getBalance={store.getAccountBalance}
          hideToolBar
        />
        
        <RecentTransactions transactions={store.transactions.slice(0, 5)} />
      </div>

      <QuickAddFab />
    </DashboardLayout>
  )
}
