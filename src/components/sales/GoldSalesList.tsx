'use client'

import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGoldSalesQuery } from '@/lib/queries/gold'
import SalesRow from './SalesRow'

export default function GoldSalesList() {
  const t = useTranslations('sales')
  const { data: sales = [], isLoading } = useGoldSalesQuery()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">{t('empty')}</h3>
          <p className="text-muted-foreground">{t('emptyDesc')}</p>
        </div>
      </Card>
    )
  }

  const ordered = [...sales].sort((a, b) => b.saleDate - a.saleDate)

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('asset')}</TableHead>
            <TableHead className="text-right">{t('weight')}</TableHead>
            <TableHead className="text-right">{t('avgCostPerGram')}</TableHead>
            <TableHead className="text-right">{t('salePricePerGram')}</TableHead>
            <TableHead>{t('purchaseDate')}</TableHead>
            <TableHead>{t('saleDate')}</TableHead>
            <TableHead className="text-right">{t('realizedPnL')}</TableHead>
            <TableHead className="text-right">{t('realizedPnLPercent')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((sale) => (
            <SalesRow
              key={sale.id}
              label={t('goldLabel')}
              quantity={`${sale.weight.toLocaleString(undefined, { maximumFractionDigits: 4 })} g`}
              avgCost={sale.averageCostPrice}
              salePrice={sale.salePrice}
              purchaseDate={sale.purchaseDate}
              saleDate={sale.saleDate}
              realizedPnL={sale.realizedPnL}
              realizedPnLPercent={sale.realizedPnLPercent}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
