'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/lib/format'
import { useGoldsSummaryQuery } from '@/lib/queries/gold'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

export default function GoldSummaryCard() {
  const formatCurrency = useFormatCurrency()
  const { data: summary, isLoading } = useGoldsSummaryQuery()

  if (isLoading) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  const totalWeight = summary?.totalWeight ?? 0
  if (totalWeight === 0) return null

  const totalValue = summary?.totalValue ?? 0
  const totalCost = summary?.totalCost ?? 0
  const goldPrice = summary?.goldPrice ?? 0
  const profit = totalValue - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0
  const isPositive = profit >= 0

  return (
    <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">Portfolio Emas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {totalWeight.toFixed(2)} g
            {totalWeight > 0 && ` · avg ${formatCurrency(totalCost / totalWeight)}/g`}
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-bold">
              {goldPrice > 0 ? formatCurrency(totalValue) : '—'}
            </p>
            {totalCost > 0 && goldPrice > 0 && (
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
            )}
          </div>
        </div>
        <Link href="/gold">
          <Button variant="outline" className="gap-2">
            Detail
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
