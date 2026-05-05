'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { TrendingUp } from 'lucide-react'

interface DashboardSummaryProps {
  totalBalance: number
  accountCount: number
  transactionCount: number
}

export default function DashboardSummary({
  totalBalance,
  accountCount,
  transactionCount,
}: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Accounts</p>
            <p className="text-3xl font-bold text-foreground">{accountCount}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">
            {accountCount}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Transactions</p>
            <p className="text-3xl font-bold text-foreground">{transactionCount}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
            {transactionCount}
          </div>
        </div>
      </Card>
    </div>
  )
}
