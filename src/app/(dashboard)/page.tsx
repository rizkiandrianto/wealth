'use client'

// Required APIs:
//   GET /api/accounts
//   GET /api/transactions?limit=5
//   GET /api/stocks
//   GET /api/stocks/sales
//   GET /api/crypto
//   GET /api/crypto/sales
//   GET /api/gold
//   GET /api/gold/sales
//   GET /api/market/prices

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import DashboardSummary from '@/components/DashboardSummary'
import AccountsList from '@/components/AccountsList'
import RecentTransactions from '@/components/RecentTransactions'
import QuickAddFab from '@/components/QuickAddFab'
import PriceTicker from '@/components/PriceTicker'
import RealizedPnLCard from '@/components/dashboard/RealizedPnLCard'
import { accountsQueryOptions } from '@/lib/queries/accounts'
import { transactionsQueryOptions, useTransactionsQuery } from '@/lib/queries/transactions'
import { stocksQueryOptions, stockSalesQueryOptions } from '@/lib/queries/stocks'
import { cryptosQueryOptions, cryptoSalesQueryOptions } from '@/lib/queries/crypto'
import { goldsQueryOptions, goldSalesQueryOptions } from '@/lib/queries/gold'
import { assetPricesQueryOptions } from '@/lib/queries/prices'
import { Skeleton } from '@/components/ui/skeleton'

const RECENT_TX_LIMIT = 5

export default function Home() {
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions())
    qc.prefetchQuery(transactionsQueryOptions({ limit: RECENT_TX_LIMIT }))
    qc.prefetchQuery(stocksQueryOptions())
    qc.prefetchQuery(stockSalesQueryOptions())
    qc.prefetchQuery(cryptosQueryOptions())
    qc.prefetchQuery(cryptoSalesQueryOptions())
    qc.prefetchQuery(goldsQueryOptions())
    qc.prefetchQuery(goldSalesQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
  }, [qc])

  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery({
    limit: RECENT_TX_LIMIT,
  })

  return (
    <DashboardLayout>
      <div className="fixed top-16.25 w-full left-0 z-1">
        <PriceTicker />
      </div>

      <div className="space-y-6 pt-7">
        <DashboardSummary />

        <RealizedPnLCard />

        <AccountsList hideToolBar />

        {txLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <RecentTransactions transactions={transactions} />
        )}
      </div>

      <QuickAddFab />
    </DashboardLayout>
  )
}
