'use client'

import { useTranslations } from 'next-intl'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { useFormatCurrency } from '@/lib/format'
import { useUIStore, type PortfolioKey } from '@/lib/store/useUIStore'
import { PORTFOLIO_COLORS, type PortfolioSlice } from '@/lib/portfolioMeta'

interface AllocationDonutProps {
  slices: ReadonlyArray<PortfolioSlice>
}

export default function AllocationDonut({ slices }: AllocationDonutProps) {
  const t = useTranslations('dashboard')
  const formatCurrency = useFormatCurrency()
  const excludedPortfolios = useUIStore((s) => s.excludedPortfolios)
  const isExcluded = (key: PortfolioKey) => excludedPortfolios.includes(key)

  const labelMap = {
    cash: t('cash'),
    stocks: t('stocks'),
    crypto: t('crypto'),
    gold: t('gold'),
  } as const

  const donutData = slices
    .filter((s) => !isExcluded(s.key) && s.value > 0)
    .map((s) => ({
      key: s.key,
      name: labelMap[s.labelKey],
      value: s.value,
      color: PORTFOLIO_COLORS[s.key],
    }))

  const tLabel = t('assetAllocation')
  const splitLabel = tLabel.split(' ')

  return (
    <div className="lg:col-span-3 flex items-center justify-center">
      <div className="relative w-full max-w-50 aspect-square">
        {donutData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={1}
                stroke="none"
                isAnimationActive={false}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                }}
                wrapperStyle={{
                  zIndex: 3
                }}
                formatter={(value: number, name) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 rounded-full border-8 border-emerald-200/60 dark:border-emerald-900/40" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-foreground">
          {splitLabel.map((word) => (
            <span key={word} className="text-sm font-semibold leading-tight">
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
