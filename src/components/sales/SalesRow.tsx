'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { useFormatCurrency, useFormatDate } from '@/lib/format'

type SalesRowProps = {
  label: string
  quantity: string
  avgCost: number
  salePrice: number
  purchaseDate: number
  saleDate: number
  realizedPnL: number
  realizedPnLPercent: number
}

export default function SalesRow({
  label,
  quantity,
  avgCost,
  salePrice,
  purchaseDate,
  saleDate,
  realizedPnL,
  realizedPnLPercent,
}: SalesRowProps) {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()
  const isPositive = realizedPnL >= 0
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right tabular-nums">{quantity}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(avgCost)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(salePrice)}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(purchaseDate)}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(saleDate)}</TableCell>
      <TableCell className={`text-right tabular-nums ${colorClass}`}>
        {formatCurrency(realizedPnL)}
      </TableCell>
      <TableCell className={`text-right tabular-nums ${colorClass}`}>
        {isPositive ? '+' : ''}
        {realizedPnLPercent.toFixed(2)}%
      </TableCell>
    </TableRow>
  )
}
