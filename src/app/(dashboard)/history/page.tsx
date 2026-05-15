'use client'

// Required APIs:
//   GET /api/accounts
//   GET /api/account-snapshots?range=3m
//   GET /api/portfolio-snapshots?range=3m

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import AccountsHistoryChart from '@/components/AccountsHistoryChart'
import PortfolioHistoryChart from '@/components/PortfolioHistoryChart'
import { accountsQueryOptions, useAccountsQuery } from '@/lib/queries/accounts'
import { accountSnapshotsQueryOptions } from '@/lib/queries/accountSnapshots'
import { portfolioSnapshotsQueryOptions } from '@/lib/queries/portfolioSnapshots'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar } from 'lucide-react'
import { useUIStore } from '@/lib/store/useUIStore'

export default function HistoryPage() {
  const qc = useQueryClient()
  const initialRange = useUIStore((s) => s.historyRange)
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions())
    qc.prefetchQuery(accountSnapshotsQueryOptions(initialRange))
    qc.prefetchQuery(portfolioSnapshotsQueryOptions(initialRange))
  }, [qc, initialRange])

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery()

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Historical Data</h1>
            <p className="text-muted-foreground">View your balance history over time</p>
          </div>

          <Card className="p-8">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground">
                Create accounts and record transactions to see your balance history
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Historical Data</h1>
          <p className="text-muted-foreground">View your portfolio and balance trends</p>
        </div>

        <Tabs defaultValue="accounts" className="gap-6">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <AccountsHistoryChart accounts={accounts} />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioHistoryChart />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
