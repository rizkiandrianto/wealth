'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { RefreshCw, Check } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import SyncConfigCheck from '@/components/sync-balance/SyncConfigCheck'
import SyncPreviewTable from '@/components/sync-balance/SyncPreviewTable'
import {
  settingsQueryOptions,
  useSettingsQuery,
} from '@/lib/queries/settings'
import {
  SyncBalancePreview,
  SyncRequestError,
  useSyncBalanceCommit,
  useSyncBalancePreview,
} from '@/lib/queries/syncBalance'

function todayJakartaDateStr(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date())
}

export default function SyncBalancePageClient({
  defaultYear,
}: {
  defaultYear: number
}) {
  const t = useTranslations('syncBalance')
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(settingsQueryOptions('sync.'))
  }, [qc])

  const [year] = useState(defaultYear)
  const [adjustmentDate, setAdjustmentDate] = useState<string>(todayJakartaDateStr())
  const [preview, setPreview] = useState<SyncBalancePreview | null>(null)

  const { data: settingsRows = [], isLoading: settingsLoading } = useSettingsQuery('sync.')

  const previewMutation = useSyncBalancePreview()
  const commitMutation = useSyncBalanceCommit()

  const today = todayJakartaDateStr()
  const minDate = `${year}-01-01`

  const handleRunSync = async () => {
    setPreview(null)
    try {
      const result = await previewMutation.mutateAsync({ year })
      setPreview(result)
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join('\n'))
      }
    } catch (err) {
      if (err instanceof SyncRequestError) {
        toast.error(err.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    const actionable = preview.diffs.filter((d) => d.action !== 'no-op')
    if (actionable.length === 0) {
      toast.info(t('nothingToSync'))
      return
    }

    try {
      const res = await commitMutation.mutateAsync({
        year: preview.year,
        adjustmentDate,
        diffs: actionable.map((d) => ({
          accountId: d.accountId,
          expectedDbBalance: d.dbBalance,
          sheetBalance: d.sheetBalance,
        })),
      })
      toast.success(t('syncedToast', { count: res.created.length }))
      const refreshed = await previewMutation.mutateAsync({ year })
      setPreview(refreshed)
    } catch (err) {
      if (err instanceof SyncRequestError && err.status === 409) {
        toast.error(t('balanceChanged'))
        try {
          const refreshed = await previewMutation.mutateAsync({ year })
          setPreview(refreshed)
        } catch {
          /* surfaced below */
        }
        return
      }
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const allNoOp =
    !!preview && preview.diffs.length > 0 && preview.diffs.every((d) => d.action === 'no-op')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {settingsLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <SyncConfigCheck year={year} rows={settingsRows} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRunSync}
            disabled={previewMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${previewMutation.isPending ? 'animate-spin' : ''}`}
            />
            {previewMutation.isPending ? t('running') : t('runSync')}
          </Button>
          <span className="text-sm text-muted-foreground">{t('yearLabel', { year })}</span>
        </div>

        {previewMutation.isPending && !preview && (
          <Skeleton className="h-40 w-full rounded-lg" />
        )}

        {preview && (
          <div className="space-y-4">
            <SyncPreviewTable diffs={preview.diffs} />

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between border border-border rounded-lg p-4">
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="adjustment-date">{t('adjustmentDate')}</Label>
                <Input
                  id="adjustment-date"
                  type="date"
                  value={adjustmentDate}
                  min={minDate}
                  max={today}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('adjustmentDateHint')}</p>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={commitMutation.isPending || allNoOp}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {commitMutation.isPending ? t('syncing') : t('confirmSync')}
              </Button>
            </div>

            {allNoOp && (
              <p className="text-sm text-muted-foreground">{t('allMatch')}</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
