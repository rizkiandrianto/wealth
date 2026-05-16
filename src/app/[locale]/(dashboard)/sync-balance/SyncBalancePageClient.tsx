'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
      toast.info('Nothing to sync — all accounts already match.')
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
      toast.success(`Synced ${res.created.length} transaction(s)`)
      // Re-fetch preview so DB/Sheet columns line up after commit.
      const refreshed = await previewMutation.mutateAsync({ year })
      setPreview(refreshed)
    } catch (err) {
      if (err instanceof SyncRequestError && err.status === 409) {
        toast.error('Balance changed since preview — refreshing.')
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Sync Balance</h1>
          <p className="text-muted-foreground">
            Compare DB balances against Google Sheet Saldo Akhir and post adjustments.
          </p>
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
            {previewMutation.isPending ? 'Running…' : 'Run Sync'}
          </Button>
          <span className="text-sm text-muted-foreground">Year {year}</span>
        </div>

        {previewMutation.isPending && !preview && (
          <Skeleton className="h-40 w-full rounded-lg" />
        )}

        {preview && (
          <div className="space-y-4">
            <SyncPreviewTable diffs={preview.diffs} />

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between border border-border rounded-lg p-4">
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="adjustment-date">Adjustment date</Label>
                <Input
                  id="adjustment-date"
                  type="date"
                  value={adjustmentDate}
                  min={minDate}
                  max={today}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Transactions are dated for this day in Asia/Jakarta.
                </p>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={commitMutation.isPending || allNoOp}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {commitMutation.isPending ? 'Syncing…' : 'Confirm sync'}
              </Button>
            </div>

            {allNoOp && (
              <p className="text-sm text-muted-foreground">
                Everything already matches the sheet — nothing to commit.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
