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
import { useStockSalesQuery } from '@/lib/queries/stocks'
import SalesRow from './SalesRow'

export default function StockSalesList() {
  const t = useTranslations('sales')
  const { data: sales = [], isLoading } = useStockSalesQuery()

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
            <TableHead>{t('ticker')}</TableHead>
            <TableHead className="text-right">{t('quantity')}</TableHead>
            <TableHead className="text-right">{t('avgCost')}</TableHead>
            <TableHead className="text-right">{t('salePrice')}</TableHead>
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
              label={sale.ticker}
              quantity={sale.quantity.toLocaleString()}
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
