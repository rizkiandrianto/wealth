'use client'

// Required APIs:
//   GET /api/accounts
//   GET /api/transactions
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

export default function Home() {
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions())
    qc.prefetchQuery(transactionsQueryOptions())
    qc.prefetchQuery(stocksQueryOptions())
    qc.prefetchQuery(stockSalesQueryOptions())
    qc.prefetchQuery(cryptosQueryOptions())
    qc.prefetchQuery(cryptoSalesQueryOptions())
    qc.prefetchQuery(goldsQueryOptions())
    qc.prefetchQuery(goldSalesQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
  }, [qc])

  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery()

  return (
    <DashboardLayout>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6">
        <PriceTicker />
      </div>

      <div className="space-y-6">
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
          <RecentTransactions transactions={transactions.slice(0, 5)} />
        )}
      </div>

      <QuickAddFab />
    </DashboardLayout>
  )
}
