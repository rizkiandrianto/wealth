'use client'

import { useAssetStore } from '@/lib/useAssetStore'
import DashboardLayout from '@/components/DashboardLayout'
import DashboardSummary from '@/components/DashboardSummary'
import AccountsList from '@/components/AccountsList'
import RecentTransactions from '@/components/RecentTransactions'

export default function Home() {
  const store = useAssetStore()

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
        
        <RecentTransactions transactions={store.transactions.slice(-5).reverse()} />
      </div>
    </DashboardLayout>
  )
}
