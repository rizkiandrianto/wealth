'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppSettingRow } from '@/lib/queries/settings'

interface SyncConfigCheckProps {
  year: number
  rows: AppSettingRow[]
}

const REQUIRED_SUFFIXES = [
  'sheetId',
  'sinarmas.range',
  'sinarmas.accountId',
  'bca.range',
  'bca.accountId',
] as const

export default function SyncConfigCheck({ year, rows }: SyncConfigCheckProps) {
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const missing = REQUIRED_SUFFIXES.filter(
    (suffix) => !map.get(`sync.${year}.${suffix}`)?.trim(),
  )

  if (missing.length === 0) return null

  return (
    <div className="border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-2 items-start">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Sync config incomplete for {year}</p>
          <p className="text-sm mt-1">
            Missing keys:{' '}
            {missing.map((suffix) => (
              <span
                key={suffix}
                className="font-mono inline-block mr-2 last:mr-0"
              >
                sync.{year}.{suffix}
              </span>
            ))}
          </p>
        </div>
      </div>
      <Link href="/settings">
        <Button variant="outline" size="sm">
          Configure
        </Button>
      </Link>
    </div>
  )
}
