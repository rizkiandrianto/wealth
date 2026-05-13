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

import DashboardLayout from '@/components/DashboardLayout'
import DashboardSummary from '@/components/DashboardSummary'
import AccountsList from '@/components/AccountsList'
import RecentTransactions from '@/components/RecentTransactions'
import QuickAddFab from '@/components/QuickAddFab'
import RealizedPnLCard from '@/components/dashboard/RealizedPnLCard'
import { useTransactionsQuery } from '@/lib/queries/transactions'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery()

  return (
    <DashboardLayout>
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
