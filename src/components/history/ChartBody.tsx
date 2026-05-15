'use client'

import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartBodyProps {
  isLoading: boolean
  isEmpty: boolean
  emptyMessage: string
  children: ReactNode
}

export default function ChartBody({ isLoading, isEmpty, emptyMessage, children }: ChartBodyProps) {
  if (isLoading) {
    return <Skeleton className="h-100 w-full rounded-xl" />
  }
  if (isEmpty) {
    return (
      <div className="h-100 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    )
  }
  return <>{children}</>
}
