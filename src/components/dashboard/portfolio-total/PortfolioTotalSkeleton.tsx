'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function PortfolioTotalSkeleton() {
  return (
    <Card className="p-6 bg-linear-to-br from-transparent to-emerald-100 border-emerald-200 dark:to-emerald-950/60 dark:border-emerald-900/70">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-7 w-56 mb-3" />
          <Skeleton className="w-full h-[180px]" />
        </div>
        <div className="lg:col-span-3 flex items-center justify-center">
          <Skeleton className="w-[160px] h-[160px] rounded-full" />
        </div>
      </div>
    </Card>
  )
}
