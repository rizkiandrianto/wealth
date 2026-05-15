'use client'

import { useEffect, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import RangeSelector from '@/components/RangeSelector'
import ChartBody from '@/components/history/ChartBody'
import type { SnapshotRange } from '@/lib/snapshot'

interface ChartCardProps {
  title: string
  headerRight?: ReactNode
  range: SnapshotRange
  onRangeChange: (range: SnapshotRange) => void
  dateFilter: DateRange | undefined
  onDateFilterChange: (range: DateRange | undefined) => void
  isLoading: boolean
  isEmpty: boolean
  emptyMessage?: string
  children: ReactNode
}

function describeDateFilter(dateFilter: DateRange | undefined): string {
  if (!dateFilter?.from && !dateFilter?.to) return 'All dates'
  if (dateFilter?.from && dateFilter?.to) {
    return `${format(dateFilter.from, 'dd MMM yyyy')} – ${format(dateFilter.to, 'dd MMM yyyy')}`
  }
  if (dateFilter?.from) return `From ${format(dateFilter.from, 'dd MMM yyyy')}`
  if (dateFilter?.to) return `Until ${format(dateFilter.to, 'dd MMM yyyy')}`
  return 'All dates'
}

export default function ChartCard({
  title,
  headerRight,
  range,
  onRangeChange,
  dateFilter,
  onDateFilterChange,
  isLoading,
  isEmpty,
  emptyMessage = 'No data available for the selected range.',
  children,
}: ChartCardProps) {
  // Auto-reset the fine-grained date popover whenever the server-side range
  // preset changes, so users don't end up filtering to a window outside the
  // fetched data. onDateFilterChange is treated as stable (typical for useState setters).
  useEffect(() => {
    onDateFilterChange(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const dateLabel = describeDateFilter(dateFilter)
  const hasDateFilter = Boolean(dateFilter?.from || dateFilter?.to)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {headerRight}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <RangeSelector value={range} onChange={onRangeChange} />

        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start gap-2">
                <Calendar className="w-4 h-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarPicker
                mode="range"
                selected={dateFilter}
                onSelect={onDateFilterChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {hasDateFilter && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDateFilterChange(undefined)}
              aria-label="Clear date filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ChartBody isLoading={isLoading} isEmpty={isEmpty} emptyMessage={emptyMessage}>
        {children}
      </ChartBody>
    </Card>
  )
}
