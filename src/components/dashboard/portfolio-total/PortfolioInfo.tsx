'use client'

import { Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useFormatCurrency } from '@/lib/format'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import { PORTFOLIO_COLORS, type PortfolioSlice } from '@/lib/portfolioMeta'
import { cn } from '@/lib/utils'

interface PortfolioInfoProps {
  total: number
  slices: ReadonlyArray<PortfolioSlice>
  investedCost: number
  investedProfit: number
  investedProfitPercent: number
}

export default function PortfolioInfo({
  total,
  slices,
  investedCost,
  investedProfit,
  investedProfitPercent,
}: PortfolioInfoProps) {
  const t = useTranslations('dashboard')
  const formatCurrency = useFormatCurrency()
  const hideValues = useUIStore((s) => s.hideValues)
  const toggleHideValues = useUIStore((s) => s.toggleHideValues)
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const togglePortfolioExclusion = useUIStore((s) => s.togglePortfolioExclusion)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)

  const labelMap = {
    cash: t('cash'),
    stocks: t('stocks'),
    crypto: t('crypto'),
    gold: t('gold'),
  } as const

  const visibleSlices = slices.filter((s) => s.key === 'cash' || s.value > 0)
  const showLabel = hideValues ? t('showValues') : t('hideValues')
  const isPositive = investedProfit >= 0

  return (
    <div className="lg:col-span-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{t('portfolioTotal')}</p>
          <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleHideValues}
          aria-label={showLabel}
          title={showLabel}
          className="w-12 h-12 shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition-colors"
        >
          {hideValues ? (
            <EyeOff className="w-6 h-6 text-white" />
          ) : (
            <Eye className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm font-medium">
        {visibleSlices.map((s) => {
          const excluded = isExcluded(s.key)
          const percent = total > 0 && !excluded ? (s.value / total) * 100 : 0
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => togglePortfolioExclusion(s.key)}
                aria-pressed={!excluded}
                className={cn(
                  'grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 w-full px-2 py-1 -mx-2 rounded-md text-left transition-colors hover:bg-emerald-200/40 dark:hover:bg-emerald-900/40',
                  excluded && 'line-through opacity-50',
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PORTFOLIO_COLORS[s.key] }}
                />
                <span className="text-muted-foreground">{labelMap[s.labelKey]}</span>
                <span className="tabular-nums text-foreground/90">{formatCurrency(s.value)}</span>
                <span className="tabular-nums text-muted-foreground text-xs w-12 text-right">
                  {excluded ? '—' : `${percent.toFixed(1)}%`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {investedCost > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium">
          <span
            className={cn(
              'flex items-center gap-1',
              isPositive ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatCurrency(investedProfit)} ({investedProfitPercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  )
}
