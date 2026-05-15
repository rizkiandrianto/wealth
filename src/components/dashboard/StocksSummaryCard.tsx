'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useStocksSummaryQuery } from '@/lib/queries/stocks'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

export default function StocksSummaryCard() {
  const formatCurrency = useFormatCurrency()
  const { data: summary, isLoading } = useStocksSummaryQuery()

  if (isLoading) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  const uniqueCount = summary?.uniqueCount ?? 0
  if (uniqueCount === 0) return null

  const totalValue = summary?.totalValue ?? 0
  const totalCost = summary?.totalCost ?? 0
  const profit = totalValue - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0
  const isPositive = profit >= 0

  return (
    <Card className="p-6 border-l-4 border-l-blue-500 bg-linear-to-br from-blue-50 to-transparent dark:from-blue-950/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Saham</h3>
          <p className="text-sm text-muted-foreground mt-1 font-bold">
            {uniqueCount} saham dimiliki
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            <p
              className={`text-sm font-medium flex items-center gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
        <Link href="/stocks">
          <Button variant="outline" className="gap-2">
            Detail
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
