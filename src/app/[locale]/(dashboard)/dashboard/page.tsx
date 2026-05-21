'use client'

// Required APIs:
//   GET /api/accounts
//   GET /api/transactions?limit=5
//   GET /api/stocks/summary        (Portfolio + Stocks card)
//   GET /api/stocks/tickers        (PriceTicker)
//   GET /api/stocks/sales/summary  (RealizedPnLCard)
//   GET /api/crypto/summary        (Portfolio + Crypto card)
//   GET /api/crypto/tickers        (PriceTicker)
//   GET /api/crypto/sales/summary  (RealizedPnLCard)
//   GET /api/gold/summary          (Portfolio + Gold card)
//   GET /api/gold/tickers          (PriceTicker)
//   GET /api/gold/sales/summary    (RealizedPnLCard)
//   GET /api/market/fx/usd-idr     (PriceTicker)

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
import {
  stocksSummaryQueryOptions,
  stocksTickersQueryOptions,
  stockSalesSummaryQueryOptions,
} from '@/lib/queries/stocks'
import {
  cryptosSummaryQueryOptions,
  cryptosTickersQueryOptions,
  cryptoSalesSummaryQueryOptions,
} from '@/lib/queries/crypto'
import {
  goldsSummaryQueryOptions,
  goldsTickerQueryOptions,
  goldSalesSummaryQueryOptions,
} from '@/lib/queries/gold'
import { usdIdrQueryOptions } from '@/lib/queries/fx'
import { Skeleton } from '@/components/ui/skeleton'

const RECENT_TX_LIMIT = 5

export default function Home() {
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions())
    qc.prefetchQuery(transactionsQueryOptions({ limit: RECENT_TX_LIMIT }))
    qc.prefetchQuery(stocksSummaryQueryOptions())
    qc.prefetchQuery(stocksTickersQueryOptions())
    qc.prefetchQuery(stockSalesSummaryQueryOptions())
    qc.prefetchQuery(cryptosSummaryQueryOptions())
    qc.prefetchQuery(cryptosTickersQueryOptions())
    qc.prefetchQuery(cryptoSalesSummaryQueryOptions())
    qc.prefetchQuery(goldsSummaryQueryOptions())
    qc.prefetchQuery(goldsTickerQueryOptions())
    qc.prefetchQuery(goldSalesSummaryQueryOptions())
    qc.prefetchQuery(usdIdrQueryOptions())
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
