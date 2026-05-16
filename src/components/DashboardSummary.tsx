'use client'

import PortfolioTotalCard from '@/components/dashboard/PortfolioTotalCard'
import StocksSummaryCard from '@/components/dashboard/StocksSummaryCard'
import CryptoSummaryCard from '@/components/dashboard/CryptoSummaryCard'
import GoldSummaryCard from '@/components/dashboard/GoldSummaryCard'

export default function DashboardSummary() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <PortfolioTotalCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StocksSummaryCard />
        <CryptoSummaryCard />
        <GoldSummaryCard />
      </div>
    </div>
  )
}
