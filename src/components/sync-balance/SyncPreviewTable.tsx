'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { useFormatCurrency } from '@/lib/format'
import { SyncBalanceDiff } from '@/lib/queries/syncBalance'

function ActionBadge({ action }: { action: SyncBalanceDiff['action'] }) {
  const t = useTranslations('syncBalance')
  if (action === 'topup') {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white">
        <ArrowUp className="w-3 h-3" />
        {t('actionTopup')}
      </Badge>
    )
  }
  if (action === 'withdrawal') {
    return (
      <Badge className="gap-1 bg-orange-600 hover:bg-orange-600 text-white">
        <ArrowDown className="w-3 h-3" />
        {t('actionWithdrawal')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Minus className="w-3 h-3" />
      {t('actionNoOp')}
    </Badge>
  )
}

export default function SyncPreviewTable({ diffs }: { diffs: SyncBalanceDiff[] }) {
  const t = useTranslations('syncBalance')
  const formatCurrency = useFormatCurrency()

  if (diffs.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
        {t.rich('noData', {
          keys: () => <span className="font-mono">sync.&lt;year&gt;.*</span>,
        })}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-3">{t('columnAccount')}</div>
        <div className="col-span-2">{t('columnSheetMonth')}</div>
        <div className="col-span-2 text-right">{t('columnSheetSaldo')}</div>
        <div className="col-span-2 text-right">{t('columnDbSaldo')}</div>
        <div className="col-span-2 text-right">{t('columnDelta')}</div>
        <div className="col-span-1 text-right">{t('columnAction')}</div>
      </div>
      <div className="divide-y divide-border">
        {diffs.map((diff) => {
          const deltaColor =
            diff.action === 'topup'
              ? 'text-emerald-600 dark:text-emerald-400'
              : diff.action === 'withdrawal'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
          const sign = diff.delta > 0 ? '+' : diff.delta < 0 ? '−' : ''
          return (
            <div
              key={diff.accountId}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm"
            >
              <div className="col-span-3 font-medium">{diff.accountName}</div>
              <div className="col-span-2 text-muted-foreground">{diff.sheetMonth || '—'}</div>
              <div className="col-span-2 text-right font-mono">
                {formatCurrency(diff.sheetBalance)}
              </div>
              <div className="col-span-2 text-right font-mono text-muted-foreground">
                {formatCurrency(diff.dbBalance)}
              </div>
              <div className={`col-span-2 text-right font-mono ${deltaColor}`}>
                {sign}
                {formatCurrency(Math.abs(diff.delta))}
              </div>
              <div className="col-span-1 flex justify-end">
                <ActionBadge action={diff.action} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
